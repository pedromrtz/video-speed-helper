## Quick onboarding for AI contributors

This repo is a small Chrome/Edge extension (Manifest V3) that adds advanced keyboard controls
for HTML5 video players and shows an on-screen indicator (OSD).

Key facts (high-level):
- Content scripts run in all frames (`all_frames: true`) and are loaded in this order: `src/utils.js`, `src/storage.js`, `src/osd.js`, `src/content_script.js` (see `manifest.json`).
- Popup UI is at `popup/popup.html` and uses `../src/storage.js` to read/write settings.
- Styling for the OSD is in `src/content_styles.css`. The OSD DOM uses `.vsh_osd_container` and `.vsh_osd_badge`.

Essential patterns and APIs to follow (concrete):
- settings: use `get_settings()` and `set_settings(patch)` from `src/storage.js` (they return Promises). Example: `const s = await get_settings()`.
- site enable/disable: `disabled_sites` is an array of hostnames in the settings; `toggle_site_disabled(hostname, disabled)` updates it.
- video discovery: use `find_all_videos()` and `observe_videos(on_found)` from `src/utils.js` to locate videos (works with shadow DOM).
- OSD: call `show_osd_speed(rate, { sticky: true|false })` and `hide_osd()` (implemented in `src/osd.js`). CSS classes control visibility.

Keyboard behaviors (explicit, copy from code):
- Shift + ArrowUp/ArrowDown: bump speed by `settings.step` (clamped to `settings.min_rate` / `settings.max_rate`).
- Shift + R: reset to 1.0x.
- Space tap (short): toggle play/pause. Space hold (>= threshold): set to `settings.hold_speed` while held. Note: code uses a `hold_threshold_ms` constant (see `src/content_script.js`) — verify timing if changing UI text.

Important implementation details & gotchas:
- Content script dedupe: code sets `window.__vsh_injected` per frame to avoid double-injecting.
- Fullscreen handling: OSD is reparented to `document.fullscreenElement` via `sync_osd_parent()` to remain visible in fullscreen.
- Cross-origin frames: content script tries same-origin `window.top` then falls back to `document.location.ancestorOrigins` to compute hostnames for the disabled-sites check.
- Storage: `chrome.storage.sync` is used when available; storage helpers gracefully fall back to defaults in non-extension environments (useful for unit tests).

Useful files to inspect for examples:
- `src/content_script.js` — main behavior, keyboard handling, rate application and hold logic.
- `src/utils.js` — helpers: `clamp`, `is_typing_context`, `find_all_videos`, `observe_videos`, `format_speed`.
- `src/storage.js` — settings contract and helper functions.
- `src/osd.js` and `src/content_styles.css` — on-screen display implementation and styles.
- `popup/popup.js` and `popup/popup.html` — popup wiring and how the UI persists settings and toggles site state.

Debugging tips:
- Load the extension via chrome://extensions/ (Developer mode -> Load unpacked) pointing to the repo folder.
- Inspect content scripts in DevTools: open the page, then Sources -> Content scripts to view `src/*` files.
- Check console for errors in the page frame where the video runs (extension logs surface in the page context).

When editing: prefer minimal, targeted changes. Keep config keys in `storage.js` stable (avoid renaming keys without migration).

If anything here is unclear or you need more examples (unit tests, small feature PRs, or a migration note), tell me which area and I will expand the instructions.
