import test from 'node:test';
import assert from 'node:assert/strict';

import { deduplicateEntries } from '../lib/dedupe.js';

test('exact duplicates (same field, frame, value) collapse', () => {
  const out = deduplicateEntries([
    { field: 'email', frameId: 0, actual: 'a@b.com' },
    { field: 'email', frameId: 0, actual: 'a@b.com' },
  ]);
  assert.equal(out.length, 1);
});

test('same field in different frames is preserved', () => {
  const out = deduplicateEntries([
    { field: 'email', frameId: 0, actual: 'a@b.com' },
    { field: 'email', frameId: 3, actual: 'a@b.com' },
  ]);
  assert.equal(out.length, 2);
});

test('same field with different values is preserved', () => {
  const out = deduplicateEntries([
    { field: 'email', frameId: 0, actual: 'a@b.com' },
    { field: 'email', frameId: 0, actual: 'x@y.com' },
  ]);
  assert.equal(out.length, 2);
});

test('whitespace-only differences collapse', () => {
  const out = deduplicateEntries([
    { field: 'name', frameId: 0, actual: ' Sara ' },
    { field: 'name', frameId: 0, actual: 'Sara' },
  ]);
  assert.equal(out.length, 1);
});

test('non-array input is safe', () => {
  assert.deepEqual(deduplicateEntries(null), []);
});
