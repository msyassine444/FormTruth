# FormTruth — Privacy Policy

_Last updated: 2026-10-06 (v1.0.0)_

## What data does FormTruth process?

FormTruth reads the values you type into web forms (names, emails, phone numbers,
dates, addresses, company, etc.) and compares them locally with your Truth
Profile that **you** create by importing/building it yourself.

## Where is it stored?

- Your Truth Profile(s), settings, and scan history are stored **only** in your
  browser via `chrome.storage.local`.
- Scan history stores minimal metadata only: domain/title, date, score, counts of
  MATCH/CONFLICT/UNKNOWN, and **field names** of conflicts — never the personal
  values themselves.
- The user can delete everything at any time: "Clear profile", "Delete" profile,
  "Clear" history, or uninstalling the extension.

## Does FormTruth send personal data to a server?

**No.** All comparison runs locally in your browser. The extension requests no
host permissions and no network permissions (`activeTab`, `scripting`, `storage`
only). The optional FastAPI backend is a local, user-run development tool that
users can point at their own documents; the extension alone never transmits data.

## What permissions does the extension use?

| Permission | Why |
|---|---|
| `activeTab` | Read form fields of the page you explicitly scan. |
| `scripting` | Run the local scan/firewall scripts in the active tab. |
| `storage` | Store your profiles, settings, and history locally. |

## JSON reports

Exported scan reports are generated and downloaded locally. Nothing is uploaded.

## Telemetry / analytics

None. FormTruth does not include analytics or tracking.
