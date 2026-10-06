# FormTruth — MVP Completion Report

Date: 2026-10-06

## Features implemented

1. **aria-labelledby support (real, not claimed)**
   - `popup.js` `collectRawFields()` now resolves `aria-labelledby` element IDs safely (missing/broken refs yield empty text) and exposes `ariaLabelledby` + `ariaLabel` in the raw descriptor.
   - `lib/identify.js` gives `aria-labelledby` the highest accessibility priority (it beats `aria-label`, `<label>`, name/id) — matching the accessible-name computation rule.
   - Regression tests added (`tests/identify.test.js`); existing `smart-test.html` case now resolves correctly.

2. **Chrome toolbar badge fixed**
   - `popup.js` sends `tabId` explicitly in the `SCAN_RESULT` payload; `background.js` prefers the explicit `tabId` and falls back to `sender.tab.id`. Badge now updates instead of silently failing.

3. **Arabic field aliases**
   - Added required Arabic aliases to `backend/parsers/fields.json` (email/phone variants, names, dob, address, city, country, postal code, company, website…), with underscore variants for multi-word aliases so both the backend (`_clean_key`) and the extension (`squash`) resolve them.
   - Regenerated `formtruth-extension/lib/fields.js` via `tools/sync_fields.py` (verified `--check` = in sync).
   - Regression tests: `tests/test_field_vocabulary.py::test_arabic_aliases_*` and `tests/identify.test.js` Arabic case.

4. **Dynamic forms**
   - New `lib/dynamic.js`: self-contained, side-effect-light `MutationObserver` installer (childList + relevant attributeFilter only). It sets a dirty flag — it never re-scans automatically, so there is no infinite loop and no full-page rescan on every mutation.
   - Popup installs it after a successful scan (`allFrames: true`, iframe behavior preserved) and shows a "page changed — scan again" hint; manual Scan behavior unchanged.
   - Unit tests in `tests/dynamic.test.js`.

5. **Duplicate field handling**
   - New `lib/dedupe.js::deduplicateEntries` collapses only semantically indistinguishable entries (same canonical field + same frameId + same trimmed value). Same field in different frames, or with different values, is preserved — conflicts are never hidden.
   - Unit tests in `tests/dedupe.test.js`.

6. **Backend upload limits**
   - Existing 5 MB cap kept; now configurable at runtime via `FORM_TRUTH_MAX_UPLOAD_BYTES` (read at validation time, safe default preserved). Tests in `tests/test_extract.py`.

7. **Backend ↔ extension normalization parity**
   - Shared case file `tests/parity_cases.json` consumed by both `tests/test_normalization_parity.py` (Python) and `formtruth-extension/tests/parity.test.js` (JS). Covers phones, whitespace, case, dates (incl. ambiguous), booleans, numbers, empty-truth, conflicts.

8. **README** — test counts updated to real numbers (188 Python / 87 JS), real "Smart Form Intelligence" capabilities documented, MVP limitations documented (contenteditable, phone prefix default, EMPTY vs backend UNKNOWN, no auto-rescan), test commands documented.

9. **popup.js modularization (safe subset)**
   - Extracted the Consistency Firewall into `lib/firewall.js` (self-contained page script preserved; `installFirewall(conflicts, tabId)`). All tests re-run green after extraction.
   - History and Scan UI remain in popup.js — extracting them would require wider refactoring of shared closures (`$`, stores, state); flagged as future work instead of risking a rewrite.

10. **Phone normalization**
    - Default country prefix made explicit and configurable (`country_prefix` param, default Morocco "212") in both `backend/services.py::_normalize_phone` and `lib/compare.js::normalizePhone`. Leading `00` international trunk prefix now stripped. Morocco behavior unchanged; parity JSON extended (Morocco + +/00-intl match case).

11. **contenteditable** — left out of MVP scope; documented as a known limitation in README.

12. **Security/privacy review** — no new permissions (`activeTab`, `scripting`, `storage` only, verified in manifest.json); no `fetch`/`XMLHttpRequest`/beacon/WebSocket anywhere in the extension; no console logging of personal data; storage remains local and clearable; message handling reviewed (tabId explicit, no form values in messages). No fake encryption added.

## Tests before / after

| Suite | Before | After |
|---|---|---|
| Python (pytest) | 184 passed | **188 passed** (+4) |
| JavaScript (node --test) | 73 passed | **87 passed** (+14) |

## Remaining known limitations

- `contenteditable` fields are not scanned.
- Phone matching relies on an explicitly configured country prefix (default Morocco); without an international prefix, local formats of other countries may not match.
- Extension-only `EMPTY` status has no backend equivalent (documented divergence).
- No periodic auto-rescan; dynamic changes surface as a hint, manual Scan remains the trigger.
- Ambiguous dates are never guessed (UNKNOWN by design).
- popup.js: history/scan UI not yet extracted into modules (firewall done; rest intentionally deferred).

## Files changed

- `formtruth-extension/popup.js` (aria-labelledby collection, badge tabId, dynamic watcher wiring, dedupe, firewall import, syntax repair after extraction)
- `formtruth-extension/background.js` (explicit tabId, sender.tab fallback)
- `formtruth-extension/lib/identify.js` (aria-labelledby priority)
- `formtruth-extension/lib/compare.js` (phone prefix param + 00-prefix)
- `formtruth-extension/lib/fields.js` (regenerated from fields.json)
- `formtruth-extension/lib/dynamic.js` (new)
- `formtruth-extension/lib/dedupe.js` (new)
- `formtruth-extension/lib/firewall.js` (new, extracted)
- `formtruth-extension/popup.html` (dirty-hint element)
- `formtruth-extension/tests/identify.test.js`, `dynamic.test.js`, `dedupe.test.js`, `parity.test.js` (new/updated)
- `backend/parsers/fields.json` (Arabic aliases)
- `backend/services.py` (phone normalization explicit/configurable)
- `backend/extractors/base.py` (env-configurable upload limit)
- `tests/test_field_vocabulary.py`, `tests/test_extract.py`, `tests/test_normalization_parity.py`, `tests/parity_cases.json` (new/updated)
- `README.md` (counts, real capabilities, limitations)
- `smart-test.html` — pre-existing aria-labelledby case now functional; no edit needed.

## Skipped risky changes

- Full modularization of popup.js (history/scan UI) — deferred to avoid a risky rewrite.
- Automatic continuous rescanning — replaced with MutationObserver hint to avoid loops/perf issues.
- Encrypting stored profile — no concrete key-management architecture; documented instead of fake encryption.

## Final test results

- `pytest`: **188 passed**, 0 failed
- `node --test`: **87 passed**, 0 failed
- `sync_fields.py --check`: in sync
- All modified JS files pass `node --check`
- No TODO/FIXME markers; no personal-data logging; manifest permissions unchanged.

## MVP readiness

FormTruth is **ready for MVP use**: local-only form consistency checking with aria-labelledby/semantic-label priority, autocomplete + data-* + placeholder/name/id fallbacks, Arabic and English vocabulary, iframe support, dynamic-form change detection (hint-based), safe duplicate handling, a working Consistency Firewall, parity-tested normalization between backend and extension, configurable upload limits, and a fully green test suite.
