# FormTruth — OpenCode Audit Report

Date: 2026-10-06
Scope: Full source-code and test audit. No files were modified, deleted, renamed, or created during the audit (this report file excepted).

Verified baselines (run live):
- Python: 184 passed (pytest)
- JavaScript: 73 passed, 0 failed (node --test)

---

## A. Current Architecture

```
FormTruth/
├── backend/                      # FastAPI (Python 3.11+)
│   ├── main.py                   # endpoints: / , /compare , /extract , /extract-facts , /build-truth
│   ├── models.py                 # Pydantic v2 models
│   ├── services.py               # Consistency Engine (normalize → MATCH/CONFLICT/UNKNOWN)
│   ├── extractors/               # txt/pdf/docx + dispatcher
│   ├── parsers/                  # facts.py (regex), context.py (Label: Value), dates.py,
│   │                             # field_mapping.py, fields.json (single source for field vocabulary)
│   └── builders/truth_builder.py # priority: hints > contextual > facts
├── formtruth-extension/          # Chrome MV3
│   ├── manifest.json             # activeTab + scripting + storage only (no host permissions)
│   ├── background.js             # badge only
│   ├── popup.html/.js/.css       # Profile + Scan + History tabs + Consistency Firewall
│   └── lib/                      # fields.js (generated from fields.json), canonicalize, identify,
│                                 # compare, dates, profile, storage, exporter, clipboard
├── tests/                        # 184 pytest tests
├── formtruth-extension/tests/    # 73 node --test tests
└── tools/sync_fields.py          # fields.json → fields.js
```

Pipeline: Documents → `/extract-facts` → `/build-truth` → Truth Profile → import into extension → local Scan → MATCH/CONFLICT/UNKNOWN/EMPTY + Firewall modal.

---

## B. Completed / Working Features

| Feature | Status | Evidence |
|---|---|---|
| FastAPI backend | ✅ | main.py; 184 tests pass |
| MATCH / CONFLICT / UNKNOWN | ✅ | services.py + compare.js (mirrored normalization) |
| EMPTY status (extension) | ✅ | compare.js |
| Truth Profile (import/export/local storage) | ✅ | profile.js, storage.js, popup |
| File text extraction | ✅ | txt/pdf/docx + dispatcher |
| Normalization: numbers/dates/phones/bools/strings | ✅ | services.py + compare.js + tests |
| Ambiguous dates → UNKNOWN (never guessed) | ✅ | `ambiguous_date` on both sides |
| TXT/PDF/DOCX support | ✅ | extractors + tests |
| Facts extraction (regex + contextual) | ✅ | facts.py, context.py |
| hints > contextual > facts priority | ✅ | truth_builder.py |
| Chrome MV3 | ✅ | MV3 manifest, no network permission |
| Semantic label beats misleading name/id | ✅ | identify.js priority order |
| autocomplete mapping | ✅ | AUTOCOMPLETE map in identify.js |
| placeholder/title/data-field/data-testid | ✅ | identify.js |
| name/id detection | ✅ | canonicalize.js (alias + substring) |
| iframes | ✅ | allFrames: true in collectRawFields + highlight |
| Consistency Firewall (blocks submit) | ✅ | firewallPageScript + modal |
| Scan history + JSON report export | ✅ | popup.js + storage.js + exporter.js |
| Privacy: local compare, no network perms | ✅ | manifest + privacy.test.js |
| Shared field vocabulary + sync + drift test | ✅ | fields.json / sync_fields.py / vocabulary test |

Note on stated baseline: the claim "aria-labelledby works" is **not accurate** — see D.

---

## C. Missing Features

1. **aria-labelledby** — not implemented in `collectRawFields()` or `identifyField()`. It only appears as a manual case in `smart-test.html` with no code support; that field is not identified.
2. **Arabic field detection in the extension** — present in backend `context.py`, but `fields.json` has **zero Arabic aliases**, so Arabic labels on webpages are not recognized.
3. **Dynamically generated forms** — no MutationObserver and no automatic re-scan; fields added after page load are only picked up by manual Scan.
4. **Duplicate fields** — no dedup/grouping; the same canonical field across iframes or repeated inputs appears as separate rows.
5. **Smart Form Intelligence** — not a real feature (only the name in smart-test.html).
6. **Backend↔extension normalization parity test** — each side has its own tests, but no cross-check that Python and JS agree on edge cases.
7. **Automatic background badge** — badge mechanism exists but is functionally dead (see D).
8. **Local storage hardening** — no encryption, no expiry for the stored Truth Profile.
9. **No extension→backend import helper** — the document→backend→Truth Profile flow is manual (curl); README documents it as manual steps.

---

## D. Bugs / Risks

1. 🔴 **aria-labelledby claimed working but not implemented.** Fix: read `aria-labelledby` in `collectRawFields` (resolve to the referenced elements' text) and pass it into `identifyField`.
2. 🔴 **Toolbar badge never updates.** `background.js` relies on `sender.tab.id`, but the message is sent from the popup via `chrome.runtime.sendMessage`, so `sender.tab` is always `undefined` and the update silently fails. Fix: pass `tabId` explicitly in the payload.
3. 🟠 **`_to_bool` runs before date detection in services.py** — "1"/"0" can become bool before date logic; ordering is fragile (JS currently mirrors the same order, so behavior is consistent but brittle).
4. 🟠 **Phone normalization assumes Morocco (+212)** — international numbers from other regions compare incorrectly.
5. 🟠 **Substring alias matching in canonicalize.js** — aliases ≥4 chars match substrings (e.g. `username` → `name`); a source of false positives, only partially mitigated by label priority.
6. 🟠 **Firewall `data-ft-idx`** depends on DOM order; if the DOM changes between Scan and Locate, the wrong field is highlighted.
7. 🟠 **`contenteditable` fields are ignored** — should be treated explicitly (in or out of scope).
8. 🟠 **popup.js is ~2210 lines** — firewall + UI + scan + history all in one file; maintenance risk.
9. 🟡 **README is outdated** — claims 174 + 53 tests; actual is 184 + 73.
10. 🟡 **Ambiguous date handling** — "25/12/2009" (day>12) parses, but US-style "12/25/2009" needs an explicit decision/test in dates.js/dates.py.
11. 🟡 **No upload size limit / cost guard** on `/extract` and `/extract-facts` — a huge PDF can exhaust memory.

---

## E. MVP Checklist (production-ready)

- [ ] Implement **aria-labelledby** in collectRawFields + identifyField + tests
- [ ] Fix **badge** (pass tabId in payload)
- [ ] Add **Arabic aliases** to fields.json and re-run sync_fields.py
- [ ] Handle **dynamic forms** (MutationObserver or at minimum a clear Re-scan path)
- [ ] **Dedup/group** repeated canonical fields in scan results
- [ ] **Max upload size** + clear error handling in the backend
- [ ] Update **README** (test counts, Smart Form Intelligence naming)
- [ ] Add **backend↔extension parity test** for normalization edge cases
- [ ] Split **popup.js** into modules (firewall.js, scan.js, history.js)
- [ ] Document or broaden **phone normalization** country coverage
- [ ] Optional: in-extension "import from backend" helper

---

## F. Recommended Implementation Order

1. Badge fix (2 lines, immediate user-visible effect, zero risk)
2. aria-labelledby (collectRawFields → identifyField → tests)
3. Arabic aliases in fields.json + sync + tests
4. Dynamic-form handling (MutationObserver / auto re-scan)
5. Duplicate-field handling in scan results
6. Upload size limits + backend error handling
7. Backend↔extension normalization parity test
8. Split popup.js + update README

---

Audit performed against the actual source tree on 2026-10-06. No project files were changed.
