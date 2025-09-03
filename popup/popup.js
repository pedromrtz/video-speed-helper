/* globals document */

(() => {
    // short refs
    const el_select = document.getElementById('hold-speed');
    const el_label = document.getElementById('hold_label');

    // update label "Hold to play at Xx"
    const update_hold_label = (val) => {
        const text = `${Number(val).toFixed(2).replace(/\.00$/, '')}x`;
        el_label.textContent = text;
        // set matching option if exists
        const opt = Array.from(el_select.options).find(o => String(o.value) === String(val));
        if (opt) el_select.value = String(val);
    };

    // load settings into UI
    const load_ui = async () => {
        const s = await get_settings();
        update_hold_label(s.hold_speed);
    };

    // persist changes to storage
    const on_change = async (e) => {
        const v = parseFloat(e.target.value) || 2.0;
        await set_settings({ hold_speed: v });
        update_hold_label(v);
    };

    el_select.addEventListener('change', on_change);
    load_ui().catch(() => {});
})();
