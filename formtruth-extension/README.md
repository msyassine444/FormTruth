# FormTruth — Browser Extension (v0.6.0)

Verify the form on the current page against your local **Truth Profile** before submitting.
All comparison happens in your browser. **No form values are ever sent anywhere.**

## Features

- Truth Profile ledger with **Import / Export JSON** (accepts a raw `POST /build-truth` response
  or a FormTruth profile export).
- Local scan of the active page (all frames) with a per-field result list.
- Statuses: **MATCH / CONFLICT / UNKNOWN / EMPTY** — never guesses.
- Highlight the field on the page and copy the required profile value.
- Toolbar badge (conflicts / unknown / matches).
- JSON report export of the last scan.
- Light / dark theme.
- **Clear profile** to delete the stored profile at any time.

## Install (developer mode)

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder
4. Pin the FormTruth icon (shortcut: `Ctrl+Shift+F`)

## Usage

1. Build a Truth Profile with the backend (`POST /build-truth`) or fill the ledger manually.
2. Profile tab → **Import / export** → paste the JSON → **Import**.
3. Open a form, open the popup, go to **Scan** → **Scan this page**.

## Status semantics

| Status   | Meaning                                              |
| -------- | ---------------------------------------------------- |
| MATCH    | The field value matches the Truth Profile            |
| CONFLICT | The field value conflicts with the Truth Profile     |
| UNKNOWN  | Not enough trusted information (never guessed)       |
| EMPTY    | The form field is empty                              |

An ambiguous written date (e.g. `05/12/2009`) is always **UNKNOWN**, never a MATCH.

## Privacy

- Comparison is local; page values are never transmitted.
- Minimal permissions: `activeTab`, `scripting`, `storage` (no host permissions, no network).
- The profile lives in `chrome.storage.local` and can be deleted via **Clear profile**.

## Development

```bash
npm test        # node --test, no dependencies
```

The field vocabulary is shared with the backend. Edit `../backend/parsers/fields.json`
and run `python ../tools/sync_fields.py` to regenerate `lib/fields.js`.

## Structure

```text
manifest.json      MV3 manifest (activeTab, scripting, storage)
background.js      badge only (classic service worker)
popup.html/js/css  profile ledger, import/export, scan UI (ES module)
lib/
  fields.js        field vocabulary (auto-generated from backend)
  canonicalize.js  field-name canonicalization
  identify.js      map a DOM field to a canonical field
  compare.js       local MATCH/CONFLICT/UNKNOWN/EMPTY engine
  dates.js         ambiguity-aware date parsing
  profile.js       Truth Profile import/export
  storage.js       injectable local storage wrapper
  exporter.js      JSON scan report
  clipboard.js     copy helper with fallback
tests/             node:test unit tests
```
