import test from 'node:test';
import assert from 'node:assert/strict';

import { FIELD_VOCABULARY, FIELD_CANONICALS } from '../lib/fields.js';

test('vocabulary exposes key canonical aliases shared with the backend', () => {
  assert.ok(FIELD_CANONICALS.includes('name'));
  assert.ok(FIELD_VOCABULARY.fields.name.aliases.includes('custname'));
  assert.ok(FIELD_VOCABULARY.fields.phone.aliases.includes('custtel'));
  assert.ok(FIELD_VOCABULARY.fields.email.aliases.includes('custemail'));
  assert.ok(FIELD_VOCABULARY.fields.national_id.aliases.includes('passport'));
});

test('every canonical field is well-formed', () => {
  for (const canonical of FIELD_CANONICALS) {
    const spec = FIELD_VOCABULARY.fields[canonical];
    assert.equal(typeof spec.label, 'string');
    assert.equal(typeof spec.group, 'string');
    assert.ok(Array.isArray(spec.aliases) && spec.aliases.length > 0);
  }
});
