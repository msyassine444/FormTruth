# FormTruth — Real-World QA Checklist (v1.0)

Run manually (or via the automated suites):

1. [ ] English registration form — fields detected, MATCH works.
2. [ ] Arabic registration form — Arabic labels resolve (البريد، الهاتف، الاسم).
3. [ ] Mixed Arabic/English form — both detected.
4. [ ] Simple contact form — email/phone/message: message ignored, email/phone matched.
5. [ ] Profile form — name/company/job title matched.
6. [ ] Checkout-like form without real payment info — address/city/country detected.
7. [ ] iframe form — fields inside iframe detected; Locate works cross-frame.
8. [ ] Dynamically generated form — MutationObserver hint appears; Scan picks new fields.
9. [ ] Duplicate fields — same value merged; different values both shown.
10. [ ] Misleading names (`id="random-name"` + `aria-label="Email"`) — aria-label wins. `username` NOT treated as name.
11. [ ] Missing labels — placeholder/title/data-*/*name/id fallback chain.
12. [ ] Conflicting values — CONFLICT with explanation; firewall modal blocks submit.
13. [ ] Unknown values — UNKNOWN with explanation; no false MATCH.
14. [ ] Empty fields — EMPTY status; excluded from score.
15. [ ] Submit with conflicts — modal: Review / Submit anyway / Cancel accessible via keyboard.
16. [ ] Submit without conflicts — no modal, submit proceeds.

Automated equivalents: `formtruth-extension/tests/integration.test.js`, `smart-test.html`, `documents/test-form.html`.
Do not use real personal data in automated tests.
