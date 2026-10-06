import test from 'node:test';
import assert from 'node:assert/strict';

import { STATUS, compareField, normalizeValue, summarize } from '../lib/compare.js';

test('EMPTY when the form field has no value', () => {
  assert.equal(compareField('Sara', ''), STATUS.EMPTY);
  assert.equal(compareField('Sara', '   '), STATUS.EMPTY);
  assert.equal(compareField('Sara', null), STATUS.EMPTY);
  assert.equal(compareField('Sara', undefined), STATUS.EMPTY);
});

test('UNKNOWN when the profile has no trusted value', () => {
  assert.equal(compareField(undefined, 'Sara'), STATUS.UNKNOWN);
  assert.equal(compareField(null, 'Sara'), STATUS.UNKNOWN);
  assert.equal(compareField('', 'Sara'), STATUS.UNKNOWN);
});

test('MATCH on equal values (trimmed, case-insensitive text)', () => {
  assert.equal(compareField('Sara El Idrissi', 'Sara El Idrissi'), STATUS.MATCH);
  assert.equal(compareField('Sara', '  sara  '), STATUS.MATCH);
});

test('CONFLICT on different values', () => {
  assert.equal(compareField('Sara', 'Dina'), STATUS.CONFLICT);
});

test('email comparison is case-insensitive', () => {
  assert.equal(compareField('sara@example.com', 'Sara@Example.com'), STATUS.MATCH);
  assert.equal(compareField('sara@example.com', 'other@example.com'), STATUS.CONFLICT);
});

test('phone comparison normalizes country code and separators', () => {
  assert.equal(compareField('0612345678', '+212612345678'), STATUS.MATCH);
  assert.equal(compareField('0612345678', '06 12 34 56 78'), STATUS.MATCH);
  assert.equal(compareField('0612345678', '0611111111'), STATUS.CONFLICT);
});

test('date comparison normalizes unambiguous formats', () => {
  assert.equal(compareField('2009-12-25', '25/12/2009'), STATUS.MATCH);
  assert.equal(compareField('2009-12-25', '12/25/2009'), STATUS.MATCH);
  assert.equal(compareField('2009-12-25', '2009/12/25'), STATUS.MATCH);
});

test('ambiguous date is UNKNOWN and never a MATCH', () => {
  assert.equal(compareField('2009-05-12', '05/12/2009'), STATUS.UNKNOWN);
  assert.equal(compareField('2009-12-05', '05/12/2009'), STATUS.UNKNOWN);
  assert.equal(compareField('05/12/2009', '2009-05-12'), STATUS.UNKNOWN);
  assert.equal(compareField('05/12/2009', '05/12/2009'), STATUS.UNKNOWN);
});

test('number vs numeric string matches', () => {
  assert.equal(compareField(2022, '2022'), STATUS.MATCH);
  assert.equal(compareField(2022, '2023'), STATUS.CONFLICT);
});

test('normalizeValue tags ambiguous dates distinctly', () => {
  assert.deepEqual(normalizeValue('05/12/2009'), ['ambiguous_date', null]);
  assert.deepEqual(normalizeValue('25/12/2009'), ['date', '2009-12-25']);
});

test('summarize counts every status', () => {
  const summary = summarize([
    { status: 'MATCH' }, { status: 'MATCH' }, { status: 'CONFLICT' },
    { status: 'UNKNOWN' }, { status: 'EMPTY' },
  ]);
  assert.deepEqual(summary, { total: 5, MATCH: 2, CONFLICT: 1, UNKNOWN: 1, EMPTY: 1 });
});
