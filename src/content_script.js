/* globals document, window */
/* requires: utils.js, storage.js, osd.js loaded before this file */

/**
 * Main content logic:
 * - attach handlers to all videos (including future ones)
 * - capture keyboard: Shift+Up/Down, Shift+R, Space(hold>=1500ms)
 * - Space tap (<1000ms) toggles play/pause; hold (>=1500ms) boosts to saved hold speed
 * - while holding Space, keep OSD visible; on release, return to 1.0x and show OSD at 1.0x
 * - respect per-site disable for both top-level page and embedded frames
 * - keep OSD visible in fullscreen by remounting inside the fullscreen element
 */

/* dedupe guard per frame */
if (window.__vsh_injected) {
	// already injected in this frame
} else {
	window.__vsh_injected = true;

	(() => {
		// state per document
		let settings = null;
		let last_known_rate = 1.0;
		let active_videos = new Set();

		// manually selected video (via click) gets priority
		let manually_selected_video = null;

		// space hold state
		let is_space_holding = false;
		let is_space_pressed = false;
		let space_timer = null;
		const hold_threshold_ms = 1000;

		/* collect hostnames to check (frame + top-level if available) */
		const get_hostnames_to_check = () => {
			const hosts = new Set();
			// current frame
			try { if (window.location?.hostname) hosts.add(window.location.hostname); } catch (_) {}
			// top-level (same-origin fast path)
			try { if (window.top?.location?.hostname) hosts.add(window.top.location.hostname); } catch (_) {
				// cross-origin fallback: ancestorOrigins
				try {
					const a = document.location?.ancestorOrigins;
					if (a && a.length) {
						// add all ancestors; last is top-most in Blink
						for (let i = 0; i < a.length; i++) {
							try {
								const u = new URL(a[i]);
								if (u.hostname) hosts.add(u.hostname);
							} catch (_) {}
						}
					}
				} catch (_) {}
			}
			return Array.from(hosts);
		};

		/* site disabled if any relevant hostname is disabled */
		const is_effectively_disabled = async () => {
			const s = await get_settings();
			const hosts = get_hostnames_to_check();
			for (const h of hosts) {
				if (s.disabled_sites.includes(h)) return true;
			}
			return false;
		};

		// attach listeners to a video
		const hook_video = (video) => {
			if (!video || active_videos.has(video)) return;

			console.log('[VSH] Hooking video:', {
				src: video.src || video.currentSrc || 'no-src',
				ready: video.readyState,
				paused: video.paused,
				size: `${video.videoWidth}x${video.videoHeight}`,
				rect: video.getBoundingClientRect()
			});

			// init rate memory
			if (!Number.isFinite(video.playbackRate)) {
				video.playbackRate = 1.0;
			}
			last_known_rate = video.playbackRate;

			// keep memory updated and show OSD on external changes
			const on_rate_change = () => {
				last_known_rate = video.playbackRate;
				console.log(`[VSH] Rate changed externally to: ${last_known_rate}`);
				show_osd_speed(last_known_rate, { sticky: is_space_holding }); // show indicator
			};
			video.addEventListener('ratechange', on_rate_change);

			// cleanup on detach/reset
			const on_remove = () => {
				console.log('[VSH] Video removed from active set');
				video.removeEventListener('ratechange', on_rate_change);
				active_videos.delete(video);
				video.removeEventListener('emptied', on_remove);
				
				// clear manual selection if this was the selected video
				if (manually_selected_video === video) {
					console.log('[VSH] Clearing manually selected video (was removed)');
					manually_selected_video = null;
				}
			};
			video.addEventListener('emptied', on_remove);

			active_videos.add(video);
			console.log(`[VSH] Total active videos: ${active_videos.size}`);
		};

		// find primary video (improved logic with manual selection priority)
		const get_primary_video = () => {
			const videos = Array.from(active_videos);
			
			// debug logging (remove after testing)
			if (videos.length > 0) {
				console.log(`[VSH] Found ${videos.length} videos:`, videos.map(v => ({
					src: v.src || v.currentSrc || 'no-src',
					paused: v.paused,
					ready: v.readyState,
					size: `${v.videoWidth}x${v.videoHeight}`,
					visible: v.getBoundingClientRect().width > 0,
					manually_selected: v === manually_selected_video
				})));
			}

			if (videos.length === 0) return null;
			
			// prioritize manually selected video if it's still active and valid
			if (manually_selected_video && active_videos.has(manually_selected_video)) {
				const rect = manually_selected_video.getBoundingClientRect();
				const still_visible = rect.width > 0 && rect.height > 0;
				if (still_visible) {
					console.log(`[VSH] Using manually selected video:`, {
						src: manually_selected_video.src || manually_selected_video.currentSrc || 'no-src'
					});
					return manually_selected_video;
				} else {
					// manually selected video is no longer visible, clear it
					console.log('[VSH] Manually selected video no longer visible, clearing selection');
					manually_selected_video = null;
				}
			}

			if (videos.length === 1) return videos[0];

			// prioritize videos that are actually playing or ready to play
			const playing_videos = videos.filter(v => !v.paused || v.readyState >= 2);
			const target_videos = playing_videos.length > 0 ? playing_videos : videos;

			let best = null;
			let best_score = -1;

			for (const v of target_videos) {
				const rect = v.getBoundingClientRect();
				const area = Math.max(0, rect.width) * Math.max(0, rect.height);
				const visible = area > 0 && rect.bottom > 0 && rect.right > 0 && 
					rect.top < window.innerHeight && rect.left < window.innerWidth;
				
				// scoring: prioritize visible, large, and ready videos
				let score = 0;
				if (visible) score += 1000;
				if (v.readyState >= 2) score += 500; // has metadata
				if (!v.paused) score += 200; // currently playing
				if (v.videoWidth > 0 && v.videoHeight > 0) score += 100; // has dimensions
				score += area; // size matters too

				if (score > best_score) {
					best = v;
					best_score = score;
				}
			}

			const result = best || videos[0];
			console.log(`[VSH] Selected video:`, {
				src: result.src || result.currentSrc || 'no-src',
				paused: result.paused,
				ready: result.readyState,
				score: best_score
			});

			return result;
		};

		// apply playback rate with clamp
		const set_rate = (video, rate) => {
			const r = clamp(rate, settings.min_rate, settings.max_rate);
			video.playbackRate = r;
			return r;
		};

		// bump helpers (keep OSD persistent if holding)
		const bump_rate = (delta) => {
			const v = get_primary_video();
			if (!v) {
				console.log('[VSH] No video for bump_rate');
				return;
			}
			const base = is_space_holding ? v.playbackRate : last_known_rate;
			const new_rate = set_rate(v, base + delta);
			if (!is_space_holding) last_known_rate = new_rate;
			console.log(`[VSH] Rate changed: ${base} -> ${new_rate} (delta: ${delta})`);
			show_osd_speed(new_rate, { sticky: is_space_holding });
		};

		const reset_rate = () => {
			const v = get_primary_video();
			if (!v) {
				console.log('[VSH] No video for reset_rate');
				return;
			}
			const new_rate = set_rate(v, 1.0);
			last_known_rate = new_rate;
			console.log(`[VSH] Rate reset to ${new_rate}`);
			show_osd_speed(new_rate, { sticky: is_space_holding });
		};

		// start hold: fetch latest saved hold_speed (live) and keep OSD sticky
		const start_space_hold = async () => {
			if (is_space_holding) return;
			const v = get_primary_video();
			if (!v) return;

			// refresh settings to honor latest popup selection
			const fresh = await get_settings();
			if (fresh) settings = fresh;

			is_space_holding = true;
			last_known_rate = v.playbackRate; // snapshot current

			const new_rate = set_rate(v, settings.hold_speed);
			show_osd_speed(new_rate, { sticky: true }); // keep visible while holding
		};

		// end hold: set back to 1.0x and show OSD at 1.0x
		const end_space_hold = () => {
			if (!is_space_holding) return;
			const v = get_primary_video();
			is_space_holding = false;
			if (!v) return;

			const new_rate = set_rate(v, 1.0);
			last_known_rate = new_rate;
			show_osd_speed(new_rate); // non-sticky so it fades
		};

		// toggle play/pause (improved with fallbacks)
		const toggle_play_pause = () => {
			const v = get_primary_video();
			if (!v) {
				console.log('[VSH] No primary video found for play/pause');
				return;
			}
			
			try {
				console.log(`[VSH] Toggling play/pause on video (currently ${v.paused ? 'paused' : 'playing'})`);
				if (v.paused) {
					v.play().catch(err => console.log('[VSH] Play failed:', err));
				} else {
					v.pause();
				}
			} catch (err) {
				console.log('[VSH] Toggle play/pause error:', err);
			}
		};

		// handle click to manually select video player
		const on_click = (e) => {
			// search for videos within the clicked element and its parents
			let current_element = e.target;
			let videos_found = [];
			
			// search up the DOM tree from clicked element
			while (current_element && current_element !== document.body && videos_found.length === 0) {
				videos_found = find_videos_in_element(current_element);
				if (videos_found.length === 0) {
					current_element = current_element.parentElement;
				}
			}

			if (videos_found.length > 0) {
				// prefer videos that are ready/playing
				const ready_videos = videos_found.filter(v => v.readyState >= 2);
				const target_video = ready_videos.length > 0 ? ready_videos[0] : videos_found[0];
				
				// hook the video if not already hooked
				if (!active_videos.has(target_video)) {
					console.log('[VSH] Found new video via click, hooking it');
					hook_video(target_video);
				}
				
				// set as manually selected
				manually_selected_video = target_video;
				console.log(`[VSH] Manually selected video via click:`, {
					src: target_video.src || target_video.currentSrc || 'no-src',
					ready: target_video.readyState,
					paused: target_video.paused
				});
				
				// show a brief indicator
				show_osd_speed(target_video.playbackRate, { sticky: false });
			}
		};

		// fullscreen sync (keep OSD mounted in fullscreen element)
		const on_fullscreen_change = () => {
			try {
				if (typeof sync_osd_parent === 'function') sync_osd_parent();
			} catch (_) {}
		};

		// keyboard handling (capture phase)
		const on_key_down = (e) => {
			// ignore typing and modifier conflicts
			if (is_typing_context(e.target)) {
				console.log('[VSH] Ignoring key in typing context:', e.target.tagName);
				return;
			}
			if (e.ctrlKey || e.altKey || e.metaKey) return;

			const video_count = active_videos.size;
			
			// Shift combos
			if (e.shiftKey) {
				if (e.code === 'ArrowUp') {
					console.log(`[VSH] Shift+Up pressed, ${video_count} videos active`);
					e.preventDefault();
					e.stopPropagation();
					bump_rate(settings.step);
					return;
				}
				if (e.code === 'ArrowDown') {
					console.log(`[VSH] Shift+Down pressed, ${video_count} videos active`);
					e.preventDefault();
					e.stopPropagation();
					bump_rate(-settings.step);
					return;
				}
				if (e.code === 'KeyR') {
					console.log(`[VSH] Shift+R pressed, ${video_count} videos active`);
					e.preventDefault();
					e.stopPropagation();
					reset_rate();
					return;
				}
			}

			// Space handling
			if (e.code === 'Space') {
				console.log(`[VSH] Space pressed, ${video_count} videos active`);
				// intercept to decide tap vs hold
				e.preventDefault();
				e.stopPropagation();

				if (is_space_pressed) return; // ignore repeats
				is_space_pressed = true;

				// enter boost mode if held
				clearTimeout(space_timer);
				space_timer = setTimeout(() => {
					if (is_space_pressed) {
						console.log('[VSH] Space hold detected');
						start_space_hold().catch(err => console.log('[VSH] Start hold error:', err));
					}
				}, hold_threshold_ms);
			}
		};

		const on_key_up = (e) => {
			if (e.code === 'Space') {
				console.log(`[VSH] Space released, was_holding: ${is_space_holding}, was_pressed: ${is_space_pressed}`);
				e.preventDefault();
				e.stopPropagation();

				clearTimeout(space_timer);

				if (is_space_holding) {
					// leaving boost: go to 1.0x and show OSD at 1x
					console.log('[VSH] Ending space hold');
					end_space_hold();
				} else if (is_space_pressed) {
					// quick tap: mimic default toggle
					console.log('[VSH] Space tap detected - toggling play/pause');
					toggle_play_pause();
				}

				is_space_pressed = false;
			}
		};

		// bootstrap
		const init = async () => {
			settings = await get_settings();

			// abort if any relevant hostname is disabled
			if (await is_effectively_disabled()) return;

			// attach to existing and future videos
			const stop_observer = observe_videos(hook_video);

			// global listeners (capture) - wait for document if needed
			const setup_listeners = () => {
				window.addEventListener('keydown', on_key_down, true);
				window.addEventListener('keyup', on_key_up, true);

				// fullscreen listeners
				document.addEventListener('fullscreenchange', on_fullscreen_change, true);
				document.addEventListener('webkitfullscreenchange', on_fullscreen_change, true);
				document.addEventListener('msfullscreenchange', on_fullscreen_change, true);

				// sync once in case we load already in fullscreen
				on_fullscreen_change();

				// cleanup
				window.addEventListener('unload', () => stop_observer());
			};

			// setup listeners when document is ready
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', setup_listeners);
			} else {
				setup_listeners();
			}

			// add click listener for manual video selection (always active)
			document.addEventListener('click', on_click, true);
		};

		init().catch(() => {});
	})();
}
