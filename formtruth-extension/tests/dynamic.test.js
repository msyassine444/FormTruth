import test from 'node:test';
import assert from 'node:assert/strict';

import { mutationRecordIsRelevant } from '../lib/dynamic.js';

test('attribute changes to field metadata are relevant', () => {
  assert.equal(
    mutationRecordIsRelevant({ type: 'attributes', attributeName: 'name' }),
    true
  );
  assert.equal(
    mutationRecordIsRelevant({ type: 'attributes', attributeName: 'aria-labelledby' }),
    true
  );
  assert.equal(
    mutationRecordIsRelevant({ type: 'attributes', attributeName: 'style' }),
    false
  );
});

test('added input/textarea/select nodes are relevant', () => {
  assert.equal(
    mutationRecordIsRelevant({
      type: 'childList',
      addedNodes: [{ nodeType: 1, tagName: 'INPUT' }],
    }),
    true
  );
  assert.equal(
    mutationRecordIsRelevant({
      type: 'childList',
      addedNodes: [{ nodeType: 1, tagName: 'DIV', querySelector: () => ({}) }],
    }),
    true
  );
  assert.equal(
    mutationRecordIsRelevant({
      type: 'childList',
      addedNodes: [{ nodeType: 3 }],
    }),
    false
  );
});

test('removed form nodes are relevant', () => {
  assert.equal(
    mutationRecordIsRelevant({
      type: 'childList',
      removedNodes: [{ nodeType: 1, tagName: 'FORM' }],
    }),
    true
  );
});

test('null record is not relevant', () => {
  assert.equal(mutationRecordIsRelevant(null), false);
});
