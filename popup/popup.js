/* globals document, chrome */

(() => {
    // refs
    const el_select = document.getElementById('hold-speed');
    const el_label = document.getElementById('hold_label');
    const el_toggle = document.getElementById('site-enabled');
    const el_pill = document.getElementById('site_state_pill');
    const el_host = document.getElementById('host_label');

    // update "Hold to play at Xx" label
    const update_hold_label = (val) => {
        const text = `${Number(val).toFixed(2).replace(/\.00$/, '')}x`;
        el_label.textContent = text;
        const opt = Array.from(el_select.options).find(o => String(o.value) === String(val));
        if (opt) el_select.value = String(val);
    };

    // update pill and toggle visuals
    const set_site_state_ui = (enabled) => {
        el_toggle.checked = !!enabled;
        el_pill.textContent = enabled ? 'Enabled' : 'Disabled';
        el_pill.classList.toggle('pill-enabled', enabled);
        el_pill.classList.toggle('pill-disabled', !enabled);
    };

    // load UI state
    const load_ui = async () => {
        const s = await get_settings();
        update_hold_label(s.hold_speed);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;

        const url = new URL(tab.url);
        el_host.textContent = url.hostname;

        const disabled = s.disabled_sites.includes(url.hostname);
        set_site_state_ui(!disabled);
    };

    // store new hold speed
    const on_change_speed = async (e) => {
        const v = parseFloat(e.target.value) || 2.0;
        await set_settings({ hold_speed: v });
        update_hold_label(v);
    };

    // toggle enable/disable for current site and refresh the page
    const on_toggle_site = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;
        const url = new URL(tab.url);

        // compute new state
        const enabled = el_toggle.checked;

        // persist disabled_sites
        await toggle_site_disabled(url.hostname, !enabled);

        // reflect UI
        set_site_state_ui(enabled);

        // refresh active tab (top-level)
        try {
            await chrome.tabs.reload(tab.id, { bypassCache: false });
        } catch (_) {}
    };

    // wire
    el_select.addEventListener('change', on_change_speed);
    el_toggle.addEventListener('change', on_toggle_site);

    // init
    load_ui().catch(() => {});
})();
