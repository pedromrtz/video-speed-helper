/* globals chrome */

/* simple storage wrapper for sync, with defaults */

const default_settings = {
    hold_speed: 1.5,
    step: 0.25,
    min_rate: 0.1,
    max_rate: 6.0,
    disabled_sites: [] // list of hostnames where extension is disabled
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

/* helpers for disabling per site */
const is_site_disabled = async (hostname) => {
    const s = await get_settings();
    return s.disabled_sites.includes(hostname);
};

const toggle_site_disabled = async (hostname, disabled) => {
    const s = await get_settings();
    let arr = [...s.disabled_sites];
    if (disabled && !arr.includes(hostname)) {
        arr.push(hostname);
    } else if (!disabled && arr.includes(hostname)) {
        arr = arr.filter((h) => h !== hostname);
    }
    await set_settings({ disabled_sites: arr });
};
