# FormTruth — Security Notes

_v1.0.0_

## Attack surface review (Phase 20)

Checked and verified:

- **No XSS sinks**: no `innerHTML`, `outerHTML`, `document.write`, or string-based `setTimeout`/`eval` in the extension source.
- **No `eval` / `new Function`** usage.
- **No content scripts** with broad host access — scripts are injected only into the active tab after the user clicks Scan (`activeTab` + `scripting`).
- **No network access**: no `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource` anywhere in the extension; privacy test guards this.
- **Message passing**: only `SCAN_RESULT` messages from popup to the background worker; payload carries counts and an explicit numeric `tabId`. Background responses are fixed `{ok:true/false}` shapes.
- **Storage**: local only; history stores field names and counts, never personal values (privacy-safe metadata).
- **DOM manipulation**: scan/firewall only set inline styles for highlighting and append locally-created nodes with `textContent` (never HTML strings).
- **Submission interception**: firewall uses capture-phase `submit`/`click` listeners, shows a modal, and never blocks when no conflicts exist. "Submit anyway" always remains available.
- **Upload handling (backend)**: size limit enforced (default 5 MB, `FORM_TRUTH_MAX_UPLOAD_BYTES`), extension validation, empty-file rejection, malformed extraction errors mapped to HTTP 400, no stack traces, no logging of document contents.

## Known risks (accepted, documented)

- Severity of `sender.tab` fallback in background worker relies on Chrome semantics; explicit `tabId` is primary.
- Field identification can misclassify unusual forms; confidence model demotes weak signals and UNKNOWN is never overridden by a guess.
- Phone normalization assumes a configured country prefix (default Morocco); mismatch produces CONFLICT rather than a false MATCH.

## Reporting

Open a GitHub issue for security concerns. Do not include real personal data in reports.
