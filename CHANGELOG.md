# Changelog

All notable changes to FormTruth are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-10-06

Commercial v1.0 release.

### Added
- Real `aria-labelledby` support (priority above `aria-label`, `<label>`, name/id).
- Toolbar badge now works (explicit tabId in scan messages).
- Arabic field aliases across the shared vocabulary (email/phone/name/dob/address/city/country/postal code/company/website).
- French field aliases (safe subset).
- Confidence model for field identification (`identifyFieldDetailed`), tiers from 0.99 (input type) down to 0.5 (name/id).
- Username/login substring false-positive guard in canonicalization.
- Dynamic-form change detection via lightweight MutationObserver (dirty hint, no auto-rescan loop).
- Safe duplicate-field handling (same field+frame+value collapsed; differing values kept separate).
- Deterministic, explainable consistency score (MATCH=1, UNKNOWN=0.5, CONFLICT=0; EMPTY excluded; field names documented).
- Plain-language explanations for CONFLICT/UNKNOWN/EMPTY in results.
- Multi-profile support (Personal/Work/School…, active profile switcher, backward compatible with single-profile storage).
- Settings: country phone prefix, firewall enable/disable, persisted locally.
- Privacy-safe history: field names and counts only, never personal values.
- Backend↔extension normalization parity test via shared JSON cases.
- Configurable upload size limit (`FORM_TRUTH_MAX_UPLOAD_BYTES`).
- Docs: PRIVACY.md, SECURITY.md, COMMERCIAL_ROADMAP.md, README updates.

### Fixed
- Badge message routing (popup→background sender.tab issue).
- `username`/`user_login` no longer misclassified as name/first_name.
- History no longer stores conflicting personal values.

### Changed
- Clear profile now clears the active profile's data (per-profile semantics).
- Firewall respects the settings toggle; no blocking when there are no conflicts (unchanged safe default).
- Version 1.0.0 across backend, pyproject, manifest, package.

## [0.6.0] - MVP

Pre-commercial MVP (275 tests passing at handoff to v1.0 work).
