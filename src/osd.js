/* On-screen display for current speed (supports sticky mode + fullscreen) */

let osd_root = null;
let osd_timer = null;

/* choose correct parent: fullscreen element or document root */
const get_osd_parent = () => document.fullscreenElement || document.documentElement;

/* ensure OSD exists and is mounted in the right parent */
const ensure_osd = () => {
	// create once
	if (!osd_root) {
		osd_root = document.createElement('div');
		osd_root.className = 'vsh_osd_container';

		const badge = document.createElement('div');
		badge.className = 'vsh_osd_badge';
		badge.textContent = '1x';

		osd_root.appendChild(badge);
	}

	// mount into current fullscreen parent if needed
	const desired_parent = get_osd_parent();
	if (osd_root.parentNode !== desired_parent) {
		desired_parent.appendChild(osd_root);
	}

	return osd_root;
};

/* allow external callers to sync parent on fullscreenchange */
const sync_osd_parent = () => {
	if (!osd_root) return;
	const desired_parent = get_osd_parent();
	if (osd_root.parentNode !== desired_parent) desired_parent.appendChild(osd_root);
};

/**
 * show current speed; sticky=true keeps it visible until hide_osd() or next non-sticky call
 */
const show_osd_speed = (rate, opts = {}) => {
	const sticky = !!opts.sticky;
	const root = ensure_osd();
	const badge = root.querySelector('.vsh_osd_badge');

	if (badge) badge.textContent = format_speed(rate);

	// make visible
	root.classList.add('vsh_show');

	// manage timers
	clearTimeout(osd_timer);

	if (sticky) {
		// keep visible while holding
		root.dataset.sticky = '1';
	} else {
		// auto-hide
		delete root.dataset.sticky;
		osd_timer = setTimeout(() => {
			root.classList.remove('vsh_show');
		}, 1200);
	}
};

/* explicit hide (used when leaving sticky mode if needed) */
const hide_osd = () => {
	const root = ensure_osd();
	clearTimeout(osd_timer);
	delete root.dataset.sticky;
	root.classList.remove('vsh_show');
};
