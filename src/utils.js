/* globals window, document */

/* tiny helpers, tab = 4 spaces, snake_case everywhere */

/**
 * clamp number into [min, max]
 */
const clamp = (value, min, max) => {
	// keep in safe bounds
	return Math.min(max, Math.max(min, value));
};

/**
 * check if target is text input or editable context
 */
const is_typing_context = (el) => {
	if (!el) return false;
	const tag = (el.tagName || '').toLowerCase();
	if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
	if (el.isContentEditable) return true;
	return false;
};

/**
 * find all videos in document and shadow roots
 */
const find_all_videos = () => {
	const found = new Set();

	// search in light DOM
	document.querySelectorAll('video').forEach((v) => found.add(v));

	// search shadow roots recursively
	const walk = (root) => {
		if (!root) return;
		if (root.querySelectorAll) {
			root.querySelectorAll('video').forEach((v) => found.add(v));
			root.querySelectorAll('*').forEach((n) => {
				if (n.shadowRoot) walk(n.shadowRoot);
			});
		}
	};

	// walk main document
	document.querySelectorAll('*').forEach((n) => {
		if (n.shadowRoot) walk(n.shadowRoot);
	});

	// also check iframes (same-origin only)
	try {
		document.querySelectorAll('iframe').forEach((iframe) => {
			try {
				if (iframe.contentDocument) {
					iframe.contentDocument.querySelectorAll('video').forEach((v) => found.add(v));
				}
			} catch (e) {
				// cross-origin iframe, skip
			}
		});
	} catch (e) {
		// iframe access failed
	}

	return Array.from(found);
};

/**
 * find videos within a specific element and its children/shadow roots
 */
const find_videos_in_element = (element) => {
	const found = new Set();
	
	if (!element) return [];

	// check if the element itself is a video
	if (element.tagName && element.tagName.toLowerCase() === 'video') {
		found.add(element);
	}

	// search in children
	if (element.querySelectorAll) {
		element.querySelectorAll('video').forEach((v) => found.add(v));
	}

	// search shadow roots recursively
	const walk_shadows = (root) => {
		if (!root || !root.querySelectorAll) return;
		
		root.querySelectorAll('video').forEach((v) => found.add(v));
		root.querySelectorAll('*').forEach((n) => {
			if (n.shadowRoot) walk_shadows(n.shadowRoot);
		});
	};

	// walk from the element down
	if (element.querySelectorAll) {
		element.querySelectorAll('*').forEach((n) => {
			if (n.shadowRoot) walk_shadows(n.shadowRoot);
		});
	}

	// check iframes within the element (same-origin only)
	try {
		if (element.querySelectorAll) {
			element.querySelectorAll('iframe').forEach((iframe) => {
				try {
					if (iframe.contentDocument) {
						iframe.contentDocument.querySelectorAll('video').forEach((v) => found.add(v));
					}
				} catch (e) {
					// cross-origin iframe, skip
				}
			});
		}
	} catch (e) {
		// iframe access failed
	}

	return Array.from(found);
};

/**
 * observe for late-added videos
 */
const observe_videos = (on_found) => {
	const seen = new WeakSet();
	let periodic_timer = null;

	const check_for_videos = () => {
		find_all_videos().forEach((v) => {
			if (!seen.has(v)) {
				seen.add(v);
				on_found(v);
			}
		});
	};

	// initial sweep
	check_for_videos();

	// mutations
	const obs = new MutationObserver(() => {
		check_for_videos();
	});

	// wait for document to be ready before observing
	const start_observer = () => {
		if (document.documentElement || document.body) {
			obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
		} else {
			// if document not ready, wait a bit
			setTimeout(start_observer, 100);
		}
	};

	// periodic check for late-loading videos (especially for sites like Crunchyroll)
	const start_periodic_check = () => {
		periodic_timer = setInterval(check_for_videos, 1000);
		// stop periodic check after 30 seconds to avoid permanent polling
		setTimeout(() => {
			if (periodic_timer) {
				clearInterval(periodic_timer);
				periodic_timer = null;
			}
		}, 30000);
	};

	// start observing when document is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			start_observer();
			start_periodic_check();
			check_for_videos(); // check again after DOM loaded
		});
	} else {
		start_observer();
		start_periodic_check();
	}

	return () => {
		obs.disconnect();
		if (periodic_timer) {
			clearInterval(periodic_timer);
			periodic_timer = null;
		}
	};
};

/**
 * format speed as 1.5x string
 */
const format_speed = (rate) => `${Number(rate).toFixed(2).replace(/\.00$/, '')}x`;
