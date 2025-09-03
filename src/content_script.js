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

			// init rate memory
			if (!Number.isFinite(video.playbackRate)) {
				video.playbackRate = 1.0;
			}
			last_known_rate = video.playbackRate;

			// keep memory updated and show OSD on external changes
			const on_rate_change = () => {
				last_known_rate = video.playbackRate;
				show_osd_speed(last_known_rate, { sticky: is_space_holding }); // show indicator
			};
			video.addEventListener('ratechange', on_rate_change);

			// cleanup on detach/reset
			const on_remove = () => {
				video.removeEventListener('ratechange', on_rate_change);
				active_videos.delete(video);
				video.removeEventListener('emptied', on_remove);
			};
			video.addEventListener('emptied', on_remove);

			active_videos.add(video);
		};

		// find primary video (visible largest)
		const get_primary_video = () => {
			const videos = Array.from(active_videos);
			if (videos.length === 0) return null;
			if (videos.length === 1) return videos[0];

			let best = null;
			let best_area = -1;
			for (const v of videos) {
				const rect = v.getBoundingClientRect();
				const area = Math.max(0, rect.width) * Math.max(0, rect.height);
				const visible = area > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
				if (visible && area > best_area) {
					best = v;
					best_area = area;
				}
			}
			return best || videos[0];
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
			if (!v) return;
			const base = is_space_holding ? v.playbackRate : last_known_rate;
			const new_rate = set_rate(v, base + delta);
			if (!is_space_holding) last_known_rate = new_rate;
			show_osd_speed(new_rate, { sticky: is_space_holding });
		};

		const reset_rate = () => {
			const v = get_primary_video();
			if (!v) return;
			const new_rate = set_rate(v, 1.0);
			last_known_rate = new_rate;
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

		// toggle play/pause (for space tap behavior)
		const toggle_play_pause = () => {
			const v = get_primary_video();
			if (!v) return;
			try {
				if (v.paused) v.play().catch(() => {});
				else v.pause();
			} catch (_) {}
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
			if (is_typing_context(e.target)) return;
			if (e.ctrlKey || e.altKey || e.metaKey) return;

			// Shift combos
			if (e.shiftKey) {
				if (e.code === 'ArrowUp') {
					e.preventDefault();
					e.stopPropagation();
					bump_rate(settings.step);
					return;
				}
				if (e.code === 'ArrowDown') {
					e.preventDefault();
					e.stopPropagation();
					bump_rate(-settings.step);
					return;
				}
				if (e.code === 'KeyR') {
					e.preventDefault();
					e.stopPropagation();
					reset_rate();
					return;
				}
			}

			// Space handling
			if (e.code === 'Space') {
				// intercept to decide tap vs hold
				e.preventDefault();
				e.stopPropagation();

				if (is_space_pressed) return; // ignore repeats
				is_space_pressed = true;

				// enter boost mode if held
				clearTimeout(space_timer);
				space_timer = setTimeout(() => {
					if (is_space_pressed) {
						start_space_hold().catch(() => {});
					}
				}, hold_threshold_ms);
			}
		};

		const on_key_up = (e) => {
			if (e.code === 'Space') {
				e.preventDefault();
				e.stopPropagation();

				clearTimeout(space_timer);

				if (is_space_holding) {
					// leaving boost: go to 1.0x and show OSD at 1x
					end_space_hold();
				} else if (is_space_pressed) {
					// quick tap: mimic default toggle
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

			// global listeners (capture)
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

		init().catch(() => {});
	})();
}
