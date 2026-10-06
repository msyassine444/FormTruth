// Consistency semantics, local-only. Mirrors backend/services.py normalization.
//
// MATCH    - form has a value that matches the trusted profile.
// CONFLICT - form has a value that conflicts with the trusted profile.
// UNKNOWN  - insufficient trusted information (never guessed).
// EMPTY    - the form field has no value.

'use strict';

import { parseDate, isAmbiguousDate } from './dates.js';

export const STATUS = Object.freeze({
  MATCH: 'MATCH',
  CONFLICT: 'CONFLICT',
  UNKNOWN: 'UNKNOWN',
  EMPTY: 'EMPTY',
});

const TRUE_VALUES = new Set(['true', 'yes', 'y', '1', 'on', 'نعم', 'صح']);
const FALSE_VALUES = new Set(['false', 'no', 'n', '0', 'off', 'لا', 'خطأ']);

function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (TRUE_VALUES.has(v)) return true;
    if (FALSE_VALUES.has(v)) return false;
  }
  return null;
}

function looksLikePhone(s) {
  if (!/^[\d\s+\-().]+$/.test(s)) return false;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return false;
  if (digits.length === 4) {
    const year = Number(digits);
    if (year >= 1900 && year <= 2100) return false;
  }
  if (digits.length === 8 && (digits.startsWith('19') || digits.startsWith('20'))) return false;
  const hasSeparator = /[\s+\-()]/.test(s);
  if (!hasSeparator && ![9, 10, 11, 12].includes(digits.length)) return false;
  return true;
}

function normalizePhone(value, countryPrefix = '212') {
  if (typeof value !== 'string' || !looksLikePhone(value)) return null;
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (countryPrefix && digits.startsWith(countryPrefix)) digits = digits.slice(countryPrefix.length);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/** @returns {[string, unknown]} a tagged, comparable representation. */
export function normalizeValue(value, countryPrefix) {
  const b = toBool(value);
  if (b !== null) return ['bool', b];

  if (isAmbiguousDate(value)) return ['ambiguous_date', null];

  if (typeof value === 'string') {
    const parsed = parseDate(value);
    if (parsed && parsed.iso) return ['date', parsed.iso];

    const s = value.trim();
    const phone = normalizePhone(s, countryPrefix);
    if (phone) return ['phone', phone];

    if (s !== '') {
      const num = Number(s.replace(/,/g, ''));
      if (!Number.isNaN(num)) return ['num', num];
    }
    return ['str', s.toLowerCase()];
  }

  if (typeof value === 'number') return ['num', value];
  return ['raw', value];
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * @returns {true|false|null} true=MATCH, false=CONFLICT, null=UNKNOWN
 */
export function valuesMatch(truthValue, formValue, countryPrefix) {
  const t = normalizeValue(truthValue, countryPrefix);
  const f = normalizeValue(formValue, countryPrefix);
  if (t[0] === 'ambiguous_date' || f[0] === 'ambiguous_date') return null;
  return t[0] === f[0] && t[1] === f[1];
}

export function compareField(truthValue, formValue, countryPrefix) {
  if (isBlank(formValue)) return STATUS.EMPTY;
  if (isBlank(truthValue)) return STATUS.UNKNOWN;
  const result = valuesMatch(truthValue, formValue, countryPrefix);
  if (result === null) return STATUS.UNKNOWN;
  return result ? STATUS.MATCH : STATUS.CONFLICT;
}

export function summarize(entries) {
  const summary = { total: entries.length, MATCH: 0, CONFLICT: 0, UNKNOWN: 0, EMPTY: 0 };
  for (const entry of entries) {
    if (summary[entry.status] === undefined) summary[entry.status] = 0;
    summary[entry.status] += 1;
  }
  return summary;
}
