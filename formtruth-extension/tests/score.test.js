import test from 'node:test';
import assert from 'node:assert/strict';

import { computeScore } from '../lib/score.js';

test('perfect form scores 100', () => {
  const { score } = computeScore([
    { status: 'MATCH', expected: 'a' },
    { status: 'MATCH', expected: 'b' },
  ]);
  assert.equal(score, 100);
});

test('all conflict scores 0', () => {
  const { score } = computeScore([
    { status: 'CONFLICT', expected: 'a' },
    { status: 'CONFLICT', expected: 'b' },
  ]);
  assert.equal(score, 0);
});

test('unknown halves the score', () => {
  const { score } = computeScore([
    { status: 'MATCH', expected: 'a' },
    { status: 'UNKNOWN', expected: 'b' },
  ]);
  assert.equal(score, 75);
});

test('empty fields and fields without profile value are excluded', () => {
  const { score, considered } = computeScore([
    { status: 'MATCH', expected: 'a' },
    { status: 'EMPTY', expected: 'b' },
    { status: 'UNKNOWN', expected: null },
  ]);
  assert.equal(considered, 1);
  assert.equal(score, 100);
});

test('no considered fields yields null score', () => {
  assert.equal(computeScore([]).score, null);
  assert.equal(computeScore([{ status: 'EMPTY', expected: 'x' }]).score, null);
});
