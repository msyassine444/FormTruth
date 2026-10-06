import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReport, serializeReport, suggestFilename, REPORT_SCHEMA } from '../lib/exporter.js';

test('buildReport summarizes statuses', () => {
  const report = buildReport([
    { field: 'name', label: 'Full name', expected: 'Sara', actual: 'Sara', status: 'MATCH' },
    { field: 'phone', expected: '0612345678', actual: '0611111111', status: 'CONFLICT' },
    { field: 'city', expected: null, actual: 'Rabat', status: 'UNKNOWN' },
  ], { url: 'https://x.test/f', title: 'Form' });

  assert.equal(report.schema, REPORT_SCHEMA);
  assert.deepEqual(report.summary, { total: 3, MATCH: 1, CONFLICT: 1, UNKNOWN: 1, EMPTY: 0 });
  assert.equal(report.page.url, 'https://x.test/f');
  assert.equal(report.results[1].status, 'CONFLICT');
});

test('serializeReport produces valid JSON', () => {
  const json = serializeReport(buildReport([], {}));
  assert.deepEqual(JSON.parse(json).results, []);
});

test('suggestFilename sanitizes the host and ends in .json', () => {
  const name = suggestFilename('weird host:8080');
  assert.ok(name.startsWith('formtruth_'));
  assert.ok(name.endsWith('.json'));
  assert.equal(/[:\s]/.test(name), false);
});
