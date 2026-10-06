/**
 * Identify the canonical field for a raw DOM field descriptor.
 *
 * Pure function:
 * takes a raw field descriptor and returns a canonical field name
 * or null. No DOM access.
 */

'use strict';

import { canonicalizeField } from './canonicalize.js';


const AUTOCOMPLETE = {
  name: 'name',
  'given-name': 'first_name',
  'family-name': 'last_name',

  email: 'email',

  tel: 'phone',
  'tel-national': 'phone',
  'tel-country-code': 'phone',

  'street-address': 'address',
  'address-line1': 'address',
  'address-line2': 'address',
  'address-level1': 'state',
  'address-level2': 'city',
  'postal-code': 'postal_code',

  country: 'country',
  'country-name': 'country',

  organization: 'company',
  'organization-title': 'job_title',

  bday: 'dob',
  'bday-day': 'dob',
  'bday-month': 'dob',
  'bday-year': 'dob',

  url: 'website',
};


export function canonicalizeAutocomplete(value) {
  const tokens = String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return null;
  }

  /*
   * Autocomplete may contain section/group tokens before
   * the actual semantic token, so inspect from right to left.
   */
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];

    if (AUTOCOMPLETE[token]) {
      return AUTOCOMPLETE[token];
    }

    if (token.startsWith('tel')) {
      return 'phone';
    }
  }

  return null;
}


function canonicalizeCandidate(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  return canonicalizeField(text);
}


function firstCanonicalCandidate(candidates) {
  for (let i = 0; i < candidates.length; i += 1) {
    const key = canonicalizeCandidate(candidates[i]);

    if (key) {
      return key;
    }
  }

  return null;
}


/*
 * Confidence per signal tier. Deterministic and explainable —
 * no fake precision. Lower tiers (placeholder/title/name/id)
 * produce low confidence and should be treated cautiously.
 */
const CONFIDENCE = Object.freeze({
  input_type: 0.99,
  autocomplete: 0.95,
  aria_labelledby: 0.95,
  aria_label: 0.9,
  label: 0.9,
  data_attribute: 0.85,
  placeholder: 0.6,
  title: 0.6,
  name_id: 0.5,
  none: 0,
});

function detailedFromCandidate(candidates, confidence, label) {
  const key = firstCanonicalCandidate(candidates);
  return key
    ? { field: key, confidence, source: label }
    : null;
}

/**
 * Detailed identification: returns { field, confidence, source }
 * or { field: null, confidence: 0, source: 'none' }.
 */
export function identifyFieldDetailed(raw) {
  if (!raw) {
    return { field: null, confidence: 0, source: 'none' };
  }

  const type = String(raw.type || '').toLowerCase().trim();

  if (type === 'email') {
    return { field: 'email', confidence: CONFIDENCE.input_type, source: 'input_type' };
  }

  if (type === 'tel') {
    return { field: 'phone', confidence: CONFIDENCE.input_type, source: 'input_type' };
  }

  if (type === 'url') {
    return { field: 'website', confidence: CONFIDENCE.input_type, source: 'input_type' };
  }

  const autocomplete = canonicalizeAutocomplete(raw.autocomplete);

  if (autocomplete) {
    return { field: autocomplete, confidence: CONFIDENCE.autocomplete, source: 'autocomplete' };
  }

  const ordered = [
    { candidates: [raw.ariaLabelledby, raw['aria-labelledby']], confidence: CONFIDENCE.aria_labelledby, source: 'aria-labelledby' },
    { candidates: [raw.ariaLabel, raw['aria-label']], confidence: CONFIDENCE.aria_label, source: 'aria-label' },
    { candidates: [raw.label], confidence: CONFIDENCE.label, source: 'label' },
    { candidates: [raw['data-field'], raw.dataField, raw['data-testid'], raw['data-test'], raw.field, raw.fieldName, raw.fieldname, raw.formField, raw.form_field], confidence: CONFIDENCE.data_attribute, source: 'data-attribute' },
    { candidates: [raw.placeholder], confidence: CONFIDENCE.placeholder, source: 'placeholder' },
    { candidates: [raw.title], confidence: CONFIDENCE.title, source: 'title' },
    { candidates: [raw.name, raw.id], confidence: CONFIDENCE.name_id, source: 'name_id' },
  ];

  for (const group of ordered) {
    const hit = detailedFromCandidate(group.candidates, group.confidence, group.source);

    if (hit) {
      return hit;
    }
  }

  return { field: null, confidence: 0, source: 'none' };
}

export function identifyField(raw) {
  if (!raw) {
    return null;
  }

  return identifyFieldDetailed(raw).field || null;
}

