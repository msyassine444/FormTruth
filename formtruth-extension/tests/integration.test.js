// End-to-end (headless) validation of the local test form.
//
// Parses documents/test-form.html, identifies each field with the real
// extension logic, compares it against a demo Truth Profile, and asserts the
// expected MATCH / CONFLICT / UNKNOWN / EMPTY outcome.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { identifyField } from '../lib/identify.js';
import { compareField, STATUS } from '../lib/compare.js';

const here = dirname(fileURLToPath(import.meta.url));
const formPath = join(here, '..', '..', 'documents', 'test-form.html');

const DEMO_PROFILE = {
  name: 'Sara El Idrissi',
  email: 'sara@example.com',
  phone: '0612345678',
  dob: '1995-04-23',
  address: '12 Rue Example',
};

function attribute(tag, name) {
  const match = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"', 'i'));
  return match ? match[1] : '';
}

function parseFormInputs(html) {
  const tags = html.match(/<input\b[^>]*>/gi) || [];
  return tags.map((tag) => ({
    type: attribute(tag, 'type') || 'text',
    name: attribute(tag, 'name'),
    id: attribute(tag, 'id'),
    placeholder: attribute(tag, 'placeholder'),
    label: '',
    value: attribute(tag, 'value'),
  }));
}

function scan(profile) {
  const html = readFileSync(formPath, 'utf8');
  const entries = [];
  for (const raw of parseFormInputs(html)) {
    const field = identifyField(raw);
    if (!field) continue;
    entries.push({
      field,
      expected: profile[field] === undefined ? null : profile[field],
      actual: raw.value,
      status: compareField(profile[field], raw.value),
    });
  }
  return entries;
}

const results = scan(DEMO_PROFILE);
const statusOf = (field) => {
  const found = results.find((r) => r.field === field);
  return found ? found.status : undefined;
};

test('every demo field is identified via the shared vocabulary', () => {
  const fields = results.map((r) => r.field).sort();
  assert.deepEqual(fields, [
    'address', 'city', 'dob', 'email', 'name', 'national_id', 'phone',
  ]);
});

test('MATCH: name and email agree with the profile', () => {
  assert.equal(statusOf('name'), STATUS.MATCH);
  assert.equal(statusOf('email'), STATUS.MATCH); // case-insensitive email
});

test('CONFLICT: phone differs from the profile', () => {
  assert.equal(statusOf('phone'), STATUS.CONFLICT);
});

test('UNKNOWN: ambiguous date is never guessed', () => {
  assert.equal(statusOf('dob'), STATUS.UNKNOWN);
});

test('UNKNOWN: fields lacking a trusted value', () => {
  assert.equal(statusOf('national_id'), STATUS.UNKNOWN);
  assert.equal(statusOf('city'), STATUS.UNKNOWN);
});

test('EMPTY: empty form field', () => {
  assert.equal(statusOf('address'), STATUS.EMPTY);
});

test('unknown is never reported as MATCH', () => {
  for (const entry of results) {
    if (entry.expected === null) {
      assert.notEqual(entry.status, STATUS.MATCH);
    }
  }
});

test('exact summary for the demo profile', () => {
  const counts = { MATCH: 0, CONFLICT: 0, UNKNOWN: 0, EMPTY: 0 };
  for (const entry of results) counts[entry.status] += 1;
  assert.deepEqual(counts, { MATCH: 2, CONFLICT: 1, UNKNOWN: 3, EMPTY: 1 });
});