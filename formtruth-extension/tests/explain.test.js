import test from 'node:test';
import assert from 'node:assert/strict';

import { explainStatus, explainEntry } from '../lib/explain.js';

test('each status has a plain-language explanation', () => {
  assert.match(explainStatus('MATCH'), /matches your Truth Profile/);
  assert.match(explainStatus('CONFLICT'), /different value/);
  assert.match(explainStatus('UNKNOWN'), /could not confidently/);
  assert.match(explainStatus('EMPTY'), /empty/);
});

test('entry explanations are user friendly', () => {
  assert.match(explainEntry({ status: 'CONFLICT' }), /CONFLICT/);
  assert.match(explainEntry({ status: 'UNKNOWN', expected: 'x' }), /could not confidently compare/);
  assert.match(explainEntry({ status: 'UNKNOWN', expected: null }), /could not confidently identify/);
  assert.match(explainEntry({ status: 'EMPTY' }), /EMPTY/);
});
