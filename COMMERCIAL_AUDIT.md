# FormTruth — Commercial v1.0 Pre-Implementation Audit

Date: 2026-10-06
Baseline verified live before this audit: **188 Python tests passed, 87 JavaScript tests passed (0 failures)**.

## Repository inventory (post-MVP state)

- `backend/` — FastAPI app: `/`, `/compare`, `/extract`, `/extract-facts`, `/build-truth`; services engine; extractors (TXT/PDF/DOCX) with env-configurable size limit; parsers (facts, context, dates, field_mapping driven by `fields.json`).
- `formtruth-extension/` — Chrome MV3: `manifest.json` (activeTab+scripting+storage only), `background.js` (badge now uses explicit tabId), `popup.js` (Profile/Scan/History tabs, firewall wired), `lib/`: canonicalize, identify, compare, dates, profile, storage, exporter, clipboard, dynamic (MutationObserver), dedupe, firewall.
- Tests: `tests/` (188), `formtruth-extension/tests/` (87).
- Shared vocabulary: `backend/parsers/fields.json` → `tools/sync_fields.py` → `lib/fields.js` (verified in sync).
- Docs: README (updated), MVP_COMPLETION_REPORT.md, OPENCODE_AUDIT.md.
- Git: many files modified vs last commit; `extension/` legacy folder deleted; `formtruth-extension/` is the active extension.

## Inconsistencies / gaps found

1. **Substring false positives**: `canonicalize.js` substring matching lets `name` match inside `username`/`user_name` — `username` can misclassify as `name`.
2. **No confidence model** in field identification — semantic tiers exist in priority order but no measurable confidence is exposed.
3. **No consistency score** — results are raw statuses; no explainable aggregate.
4. **History stores personal values** (`conflicts[].actual/expected`) — should be metadata-only for privacy.
5. **Single profile only** — no Personal/Work/School profiles.
6. **Settings are hardcoded** — country phone prefix, firewall on/off, history retention, etc.
7. **Firewall modal** has Review (Go back) and Submit Anyway, no explicit Cancel path naming; only `name/email/phone/date_of_birth` guarded.
8. **No PRIVACY.md / SECURITY.md / CHANGELOG.md / COMMERCIAL_ROADMAP.md**.
9. **Version still 0.6.0** in backend, pyproject, manifest, popup footer.
10. **French aliases absent** from vocabulary.
11. **History UI shows conflict values** (mirrors #4).
12. **Backend error messages** echo `str(e)` — mostly fine; extraction errors already structured; no stack traces exposed (verified).
13. **No debouncing** on dynamic-form hint path (it is flag-based, so acceptable); scan itself is manual.

## Risks

- Multi-profile + settings touch storage and popup state heavily — must be backward compatible with existing `truthProfile` and `requestHistory` keys.
- French aliases: only safe, unambiguous terms should be added (`prénom`, `téléphone`, `ville`, `pays`, `code_postal`, `adresse`, `date_de_naissance`, `entreprise`, `site_web`, `nom_de_famille`). Avoid ambiguous `nom`, `email` handled by exact match.
- Score must be deterministic and documented.
- Firewall must remain passive when there are no conflicts (verified current behavior).

## Plan mapping to phases

- Phase 1: architecture documented in README/architecture section (extend, not replace).
- Phase 2: Truth Profile 2.0 — metadata-tolerant import (`label/source/last_updated/confidence` ignored safely if present in unknown keys), multi-profile minimal support (Phase 9).
- Phase 3: confidence scoring (detailed identify), substring false-positive guard, French aliases.
- Phase 4: explanation strings for CONFLICT/UNKNOWN (+ UI display).
- Phase 5: deterministic consistency score, documented.
- Phase 6: firewall UX polish (Review/Submit Anyway/Cancel), guarded field list unchanged.
- Phase 7: explanations in UI.
- Phase 8: history stores field names + counts only.
- Phase 9: multi-profile (profiles map + active profile), backward compatible.
- Phase 10: PRIVACY.md, no new permissions.
- Phase 11: settings (active profile, country prefix, firewall toggle, clear data).
- Phase 12: modest UI improvements already partly present; keep.
- Phase 13: performance review notes (flag-based observer is cheap; manual scans).
- Phase 14: backend verified; add tests if needed.
- Phase 15: tests added per feature; run pytest + npm test.
- Phase 16: QA checklist document.
- Phase 17: docs (README update, PRIVACY, SECURITY, CHANGELOG, COMMERCIAL_ROADMAP).
- Phase 18: version 1.0.0 (only if all gates pass).
- Phase 19–21: code quality pass, final security audit, release gate.

No application code was modified during this audit.
