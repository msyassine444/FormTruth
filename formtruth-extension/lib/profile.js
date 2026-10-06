// Truth Profile import/export. Local only - no network.
//
// Accepts any of:
//   { truth: {...} }                       // raw POST /build-truth response
//   { profile: {...}, schema: ... }        // FormTruth portable profile
//   { name: "...", email: "..." }          // bare field map
// Field names are canonicalized with the shared vocabulary.

'use strict';

import { canonicalizeField } from './canonicalize.js';

export const PROFILE_SCHEMA = 'formtruth.truth-profile';
export const PROFILE_VERSION = 1;

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * @returns {{profile: Record<string,string>, ignored: string[]}}
 */
export function normalizeProfile(input) {
  let raw = input;
  if (raw && typeof raw === 'object') {
    if (raw.truth && typeof raw.truth === 'object') raw = raw.truth;
    else if (raw.profile && typeof raw.profile === 'object') raw = raw.profile;
  }

  const profile = {};
  const ignored = [];
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(raw)) {
      const canonical = canonicalizeField(key);
      const value = raw[key];
      if (canonical && !isBlank(value)) {
        if (!(canonical in profile)) profile[canonical] = String(value).trim();
      } else if (!canonical) {
        ignored.push(key);
      }
    }
  }
  return { profile, ignored };
}

export function parseProfileText(text) {
  const data = JSON.parse(text);
  return normalizeProfile(data);
}

export function hasProfile(profile) {
  return Boolean(profile) && Object.values(profile).some((v) => !isBlank(v));
}

export function buildPortableProfile(profile) {
  return {
    schema: PROFILE_SCHEMA,
    version: PROFILE_VERSION,
    generator: 'FormTruth',
    profile: { ...profile },
  };
}

export function profileToText(profile) {
  return JSON.stringify(buildPortableProfile(profile), null, 2);
}
