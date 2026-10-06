// Semantically safe duplicate handling for scan results.
//
// A page may legitimately contain the same canonical field more
// than once (e.g. an "email" input in the main frame and one in
// an iframe, or a repeated optional field). We must NOT remove
// those blindly. We only collapse entries that are indistinguishable
// for comparison purposes: same canonical field, same frame, and
// the same actual value. If values differ, the entries stay
// separate so a CONFLICT is never hidden.

'use strict';

export function deduplicateEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const seen = new Set();
  const out = [];

  for (const entry of entries) {
    if (!entry) {
      continue;
    }

    const key = [
      entry.field,
      entry.frameId === undefined || entry.frameId === null
        ? ''
        : entry.frameId,
      String(entry.actual === undefined || entry.actual === null ? '' : entry.actual).trim(),
    ].join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(entry);
  }

  return out;
}
