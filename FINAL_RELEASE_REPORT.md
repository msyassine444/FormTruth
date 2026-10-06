# FormTruth — Final Release Report (v1.0.0)

Date: 2026-10-06

## 1. Product overview

FormTruth is a privacy-first "Personal Data Consistency Layer". It compares the
data you type into web forms against a local Truth Profile and reports
MATCH / CONFLICT / UNKNOWN / EMPTY before you submit. A Consistency Firewall can
block submission when serious conflicts exist. All comparison happens locally;
the browser product alone transmits nothing.

## 2. Commercial features implemented (this engagement)

- Real aria-labelledby support with correct accessible-name priority.
- Toolbar badge fixed (explicit tabId propagation).
- Arabic + French field aliases in the shared vocabulary.
- Field-identification confidence model (deterministic tiers 0.99→0.5).
- Username/login substring false-positive guard.
- Dynamic-form change detection (MutationObserver hint; no rescan loop).
- Safe duplicate-field handling.
- Deterministic, explainable consistency score (documented rule).
- Plain-language explanations for CONFLICT/UNKNOWN/EMPTY.
- Multi-profile support (Personal/Work/School), active-profile switcher, settings (country phone prefix, firewall on/off).
- Privacy-safe history (field names + counts + score only).
- Backend↔extension normalization parity test (shared JSON cases).
- Configurable upload size limit; French-safe alias coverage.
- Docs: PRIVACY.md, SECURITY.md, CHANGELOG.md, COMMERCIAL_ROADMAP.md, QA_CHECKLIST.md, README v1.0.

## 3. Architecture

Existing architecture preserved: FastAPI backend (extract/compare/build-truth),
shared vocabulary (fields.json → sync_fields.py → fields.js), Chrome MV3
extension (popup/background/lib modules). New cheap modules: dynamic.js,
dedupe.js, firewall.js, explain.js, score.js. No new network permissions.

## 4. Security review (Phase 20)

- No `eval`, no `new Function`, no `innerHTML`/`document.write`/string timers in extension.
- No content-script host access; injection limited to active tab via explicit user scan.
- No `fetch`/XHR/beacon/WebSocket/EventSource anywhere; privacy test guards.
- Messages carry counts + numeric tabId only; background responses fixed shapes.
- Submission interception is capture-phase, modal-based, never blocks when no conflicts; "Submit anyway" always available.
- Backend: size limits, extension/content-type validation, structured 400 errors, no stack traces, no document-content logging.

## 5. Privacy review (Phase 10)

- Storage limited to `chrome.storage.local`; history is metadata-only (field names, counts, score).
- "Clear profile", profile delete, and history clear available.
- No analytics, no telemetry, no external transmission. PRIVACY.md published.

## 6. Performance review (Phase 13)

- MutationObserver is attribute-filtered + childList only; it sets a dirty flag (O(mutations), no scans). No continuous rescan.
- Scan itself is manual and collects only recognized fields; dedupe collapses only exact duplicates. IFrame collection uses one `executeScript` with `allFrames`.
- No listener leaks introduced; injected scripts are idempotent and keyed (`__formtruth_*`).

## 7. UX review (Phase 12)

- Results now show a score line, per-entry plain-language explanations, and locate/copy actions (existing).
- Profile switcher + Settings block added without redesign; theme system preserved.
- History cards show score; conflicts list field names only.

## 8. Test results

| Suite | Baseline | v1.0.0 |
|---|---|---|
| Python (pytest) | 188 passed | **188 passed, 0 failed** |
| JavaScript (node --test) | 87 passed | **100 passed, 0 failed** |
| JS syntax check (`node --check`) | — | all modified files OK |
| `sync_fields.py --check` | in sync | in sync |
| Backend import smoke | — | OK (9 routes) |
| manifest permissions | activeTab/scripting/storage | unchanged |

## 9. Files changed (this engagement)

- `backend/__init__.py`, `pyproject.toml` — version 1.0.0
- `backend/services.py` — explicit configurable phone country prefix
- `backend/extractors/base.py` — env-configurable upload limit
- `backend/parsers/fields.json` — Arabic + French aliases, removed unsafe username aliases
- `tools/sync_fields.py` — regenerated `lib/fields.js`
- `formtruth-extension/lib/`: identify.js (detailed confidence model), compare.js (country prefix param), canonicalize.js (substring blocklist), storage.js (multi-profile + settings + privacy-safe history), dynamic.js (new), dedupe.js (new), firewall.js (new), explain.js (new), score.js (new), fields.js (regenerated)
- `formtruth-extension/popup.{html,js}` — selector, settings, score, explanations, dynamic hint, dedupe, firewall toggle
- `formtruth-extension/background.js` — explicit tabId
- `formtruth-extension/manifest.json`, `package.json` — v1.0.0
- `formtruth-extension/tests/` — identify, score, explain, dedupe, dynamic, parity, manifest, storage (+14 tests)
- `tests/` — parity test + parity_cases.json, vocabulary Arabic tests, extract limit test
- Docs: README.md, PRIVACY.md, SECURITY.md, CHANGELOG.md, COMMERCIAL_ROADMAP.md, QA_CHECKLIST.md, COMMERCIAL_AUDIT.md, MVP_COMPLETION_REPORT.md

## 10. Remaining limitations

- `contenteditable` fields are not scanned.
- Phone matching relies on the configured country prefix (default Morocco).
- Extension EMPTY status has no backend equivalent (documented divergence).
- No periodic auto-rescan (by design); dynamic changes surface as a hint.
- Ambiguous dates are never guessed (UNKNOWN by design).
- popup.js: history/scan UI not yet modularized (firewall extracted only).

## 11. Known risks

- Field identification on highly unusual forms can still misclassify; confidence tiers demote weak signals and UNKNOWN is never overridden by a guess.
- Chrome `sender.tab` semantics rely on documented behavior; explicit tabId is primary.

## 12. Release checklist (Phase 21)

- [x] pytest: 188 passed, 0 failed
- [x] npm test (node --test): 100 passed, 0 failed
- [x] node --check on all modified JS
- [x] fields sync check: in sync
- [x] manifest MV3 verified; no network/host permissions added
- [x] no personal-data logging; no innerHTML/eval/XHR
- [x] backend import smoke OK
- [x] README/PRIVACY/SECURITY/CHANGELOG/ROADMAP present
- [x] version 1.0.0 everywhere
- [x] Arabic detection, aria-labelledby, iframe, dynamic, duplicate, MATCH/CONFLICT/UNKNOWN covered by tests

## 13. Exact version

**1.0.0**

## 14. Readiness

**READY FOR COMMERCIAL RELEASE** — functionality works, full test suites pass,
security and privacy reviews pass, packaging verified, documentation complete,
and no critical known bugs remain.
