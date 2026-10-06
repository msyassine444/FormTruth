// Field-name canonicalization driven by the shared vocabulary
// (lib/fields.js, generated from backend/parsers/fields.json).

'use strict';

import { FIELD_VOCABULARY } from './fields.js';

const SQUASH_RE = /[\s_\-.\[\]]/g;

export function squash(value) {
  return String(value === null || value === undefined ? '' : value)
    .toLowerCase()
    .replace(SQUASH_RE, '');
}

const ALIAS_INDEX = Object.create(null);
const SUBSTRING_ALIASES = [];

(function build() {
  const fields = FIELD_VOCABULARY.fields || {};
  for (const canonical of Object.keys(fields)) {
    const aliases = fields[canonical].aliases || [];
    for (const alias of aliases) {
      const key = squash(alias);
      if (key && !(key in ALIAS_INDEX)) ALIAS_INDEX[key] = canonical;
    }
  }
  for (const alias of Object.keys(ALIAS_INDEX)) {
    if (alias.length >= 4) SUBSTRING_ALIASES.push(alias);
  }
  // Longest first, so "mailingaddress" wins over "mail".
  SUBSTRING_ALIASES.sort((a, b) => b.length - a.length);
})();

/*
 * Substrings that must never be promoted to a canonical field even
 * when they contain a known alias. e.g. `username` contains `name`
 * but is NOT a person's full name field.
 */
const SUBSTRING_BLOCKLIST = [
  'username',
  'user_name',
  'filename',
  'hostname',
  'login',
  'logname',
  'subdomain',
];

function isBlocklistedNeedle(needle) {
  return SUBSTRING_BLOCKLIST.some((token) => needle.includes(token));
}

export function canonicalizeField(raw) {
  if (raw === null || raw === undefined) return null;
  const needle = squash(raw);
  if (!needle) return null;

  if (needle in ALIAS_INDEX) return ALIAS_INDEX[needle];

  if (isBlocklistedNeedle(needle)) return null;

  for (let i = 0; i < SUBSTRING_ALIASES.length; i += 1) {
    if (needle.indexOf(SUBSTRING_ALIASES[i]) !== -1) {
      return ALIAS_INDEX[SUBSTRING_ALIASES[i]];
    }
  }
  return null;
}

export function fieldMeta(canonical) {
  return (FIELD_VOCABULARY.fields || {})[canonical] || null;
}

export function labelFor(canonical) {
  const meta = fieldMeta(canonical);
  return meta ? meta.label : canonical;
}

export function typeFor(canonical) {
  const meta = fieldMeta(canonical);
  return meta ? meta.type : 'text';
}

/** Fields shown in the profile ledger, grouped in vocabulary order. */
export function profileGroups() {
  const order = FIELD_VOCABULARY.groups || [];
  const buckets = new Map(order.map((g) => [g, { group: g, fields: [] }]));
  const fields = FIELD_VOCABULARY.fields || {};
  for (const canonical of Object.keys(fields)) {
    const spec = fields[canonical];
    if (!spec.in_profile) continue;
    const bucket = buckets.get(spec.group) || buckets.get('other');
    if (bucket) bucket.fields.push({ canonical, ...spec });
  }
  return order.map((g) => buckets.get(g)).filter((b) => b && b.fields.length > 0);
}

export { FIELD_VOCABULARY };
