// Deterministic, ambiguity-aware date parsing.
// Mirrors backend/parsers/dates.py so the extension and backend agree.
// Never guesses: an ambiguous date (e.g. 05/12/2009) yields iso=null.

'use strict';

const SEPARATORS = /[-/. \t]+/;

function makeIso(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (![y, m, d].every(Number.isInteger)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  const pad = (n, width) => String(n).padStart(width, '0');
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

/**
 * @param {unknown} raw
 * @returns {{raw:string, iso:(string|null), ambiguous:boolean, candidates:string[]}|null}
 */
export function parseDate(raw) {
  if (raw === null || raw === undefined) return null;

  const text = String(raw).trim();
  const parts = text.split(SEPARATORS);
  if (parts.length !== 3 || !parts.every((p) => /^\d+$/.test(p))) return null;

  const [first, second, third] = parts;

  // Year-first: 2009-05-12 / 2009/05/12 -> a single unambiguous reading.
  if (first.length === 4) {
    const iso = makeIso(first, second, third);
    if (!iso) return null;
    return { raw: text, iso, ambiguous: false, candidates: [iso] };
  }

  // Year-last: DD/MM or MM/DD.
  if (third.length !== 2 && third.length !== 4) return null;
  const year = third.length === 4 ? third : '20' + third;

  const ddmm = makeIso(year, second, first); // day=first, month=second
  const mmdd = makeIso(year, first, second); // month=first, day=second
  const candidates = [];
  for (const c of [ddmm, mmdd]) {
    if (c && !candidates.includes(c)) candidates.push(c);
  }

  if (candidates.length === 1) {
    return { raw: text, iso: candidates[0], ambiguous: false, candidates };
  }
  if (candidates.length >= 2) {
    return { raw: text, iso: null, ambiguous: true, candidates };
  }
  return null;
}

export function isAmbiguousDate(value) {
  if (typeof value !== 'string') return false;
  const parsed = parseDate(value);
  return Boolean(parsed && parsed.ambiguous);
}
