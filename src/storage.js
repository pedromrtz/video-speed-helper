/* globals chrome */

/* simple storage wrapper for sync, with defaults */

const default_settings = {
	hold_speed: 1.5,         // default selected hold speed
	step: 0.25,              // increment step for arrows
	min_rate: 0.25,           // min playbackRate
	max_rate: 6.0            // max playbackRate
};

const get_settings = () => {
	return new Promise((resolve) => {
		if (!chrome?.storage?.sync) {
			resolve({ ...default_settings });
			return;
		}
		chrome.storage.sync.get(default_settings, (data) => {
			resolve(data || { ...default_settings });
		});
	});
};

const set_settings = (patch) => {
	return new Promise((resolve) => {
		if (!chrome?.storage?.sync) {
			resolve();
			return;
		}
		chrome.storage.sync.set(patch, () => resolve());
	});
};
