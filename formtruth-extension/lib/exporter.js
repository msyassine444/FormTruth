// Scan report builder (local export, no network).

'use strict';

export const REPORT_SCHEMA = 'formtruth.report';

export function buildReport(entries, meta = {}) {
  const summary = { total: entries.length, MATCH: 0, CONFLICT: 0, UNKNOWN: 0, EMPTY: 0 };
  for (const entry of entries) {
    if (summary[entry.status] === undefined) summary[entry.status] = 0;
    summary[entry.status] += 1;
  }

  return {
    schema: REPORT_SCHEMA,
    generator: 'FormTruth',
    generatedAt: new Date().toISOString(),
    page: { url: meta.url || '', title: meta.title || '' },
    summary,
    results: entries.map((entry) => ({
      field: entry.field || '',
      label: entry.label || '',
      expected: entry.expected === undefined ? null : entry.expected,
      actual: entry.actual === undefined ? null : entry.actual,
      status: entry.status || 'UNKNOWN',
    })),
  };
}

export function serializeReport(report) {
  return JSON.stringify(report, null, 2);
}

export function suggestFilename(host) {
  const safe = String(host || 'page').replace(/[^a-z0-9.-]/gi, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `formtruth_${safe}_${ts}.json`;
}
