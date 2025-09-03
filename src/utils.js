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

	// search shadow roots
	const walk = (root) => {
		if (!root) return;
		if (root.querySelectorAll) {
			root.querySelectorAll('video').forEach((v) => found.add(v));
			root.querySelectorAll('*').forEach((n) => {
				if (n.shadowRoot) walk(n.shadowRoot);
			});
		}
	};

	document.querySelectorAll('*').forEach((n) => {
		if (n.shadowRoot) walk(n.shadowRoot);
	});

	return Array.from(found);
};

/**
 * observe for late-added videos
 */
const observe_videos = (on_found) => {
	const seen = new WeakSet();

	// initial sweep
	find_all_videos().forEach((v) => {
		if (!seen.has(v)) {
			seen.add(v);
			on_found(v);
		}
	});

	// mutations
	const obs = new MutationObserver(() => {
		find_all_videos().forEach((v) => {
			if (!seen.has(v)) {
				seen.add(v);
				on_found(v);
			}
		});
	});
	obs.observe(document.documentElement || document.body, { childList: true, subtree: true });

	return () => obs.disconnect();
};

/**
 * format speed as 1.5x string
 */
const format_speed = (rate) => `${Number(rate).toFixed(2).replace(/\.00$/, '')}x`;
