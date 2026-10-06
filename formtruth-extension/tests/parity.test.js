import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { compareField, STATUS } from '../lib/compare.js';

const cases = JSON.parse(
  readFileSync(new URL('../../tests/parity_cases.json', import.meta.url), 'utf8')
).cases;

test('extension normalization matches shared parity cases', () => {
  for (const caseData of cases) {
    for (const [field, expected] of Object.entries(caseData.expected)) {
      const status = compareField(caseData.truth[field], caseData.form[field]);
      assert.equal(
        status,
        expected,
        `case failed: ${caseData.name} (field=${field}, got=${status}, want=${expected})`
      );
    }
  }
});

test('EMPTY is extension-only (documented divergence)', () => {
  assert.equal(compareField('x', ''), STATUS.EMPTY);
  assert.equal(compareField(undefined, 'x'), STATUS.UNKNOWN);
});
