import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDate, isAmbiguousDate } from '../lib/dates.js';

test('iso date is unambiguous', () => {
  const parsed = parseDate('2009-12-05');
  assert.equal(parsed.iso, '2009-12-05');
  assert.equal(parsed.ambiguous, false);
});

test('year-first slash is unambiguous', () => {
  assert.equal(parseDate('2009/12/05').iso, '2009-12-05');
});

test('dd/mm is unambiguous when day > 12', () => {
  const parsed = parseDate('25/12/2009');
  assert.equal(parsed.iso, '2009-12-25');
  assert.equal(parsed.ambiguous, false);
});

test('mm/dd is unambiguous when first slot > 12', () => {
  const parsed = parseDate('12/25/2009');
  assert.equal(parsed.iso, '2009-12-25');
  assert.equal(parsed.ambiguous, false);
});

test('ambiguous date keeps both candidate readings', () => {
  const parsed = parseDate('05/12/2009');
  assert.equal(parsed.ambiguous, true);
  assert.equal(parsed.iso, null);
  assert.deepEqual(new Set(parsed.candidates), new Set(['2009-12-05', '2009-05-12']));
});

test('symmetric ambiguous date is also flagged', () => {
  assert.equal(parseDate('12/05/2009').ambiguous, true);
});

test('two-digit year parses', () => {
  assert.equal(parseDate('25/12/09').iso, '2009-12-25');
});

test('same day and month is not ambiguous', () => {
  const parsed = parseDate('05/05/2009');
  assert.equal(parsed.ambiguous, false);
  assert.equal(parsed.iso, '2009-05-05');
});

test('invalid dates return null', () => {
  assert.equal(parseDate('2009-13-01'), null);
  assert.equal(parseDate('not a date'), null);
  assert.equal(parseDate('2009-05'), null);
  assert.equal(parseDate(''), null);
  assert.equal(parseDate(null), null);
});

test('isAmbiguousDate guards non-strings', () => {
  assert.equal(isAmbiguousDate('05/12/2009'), true);
  assert.equal(isAmbiguousDate('2009-12-05'), false);
  assert.equal(isAmbiguousDate(2009), false);
});
