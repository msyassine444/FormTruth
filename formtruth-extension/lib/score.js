// Deterministic, explainable consistency score.
//
// Rule (documented in README + PRIVACY.md):
//   For every recognized form field that maps to a profile field:
//     MATCH   = 1 point
//     UNKNOWN = 0.5 point (uncertain, not trusted)
//     CONFLICT = 0 points
//   EMPTY fields (no value in the form) are excluded from the
//   denominator because there is nothing to verify yet.
//   Fields not present in the profile are excluded.
//
// Score = round(100 * points / consideredFields).
// Range 0..100, integer. No weighting, no AI, fully deterministic.

'use strict';

import { STATUS } from './compare.js';

export function computeScore(entries) {
  const list = Array.isArray(entries) ? entries : [];
  let considered = 0;
  let points = 0;

  for (const entry of list) {
    if (!entry || entry.status === STATUS.EMPTY) {
      continue;
    }

    if (entry.expected === null || entry.expected === undefined || entry.expected === '') {
      continue;
    }

    considered += 1;

    if (entry.status === STATUS.MATCH) {
      points += 1;
    } else if (entry.status === STATUS.UNKNOWN) {
      points += 0.5;
    }
  }

  if (considered === 0) {
    return { score: null, considered: 0, breakdown: { match: 0, conflict: 0, unknown: 0, empty: 0 } };
  }

  const breakdown = { match: 0, conflict: 0, unknown: 0, empty: 0 };

  for (const entry of list) {
    if (!entry || !entry.status) {
      continue;
    }

    const key = entry.status.toLowerCase();

    if (key in breakdown) {
      breakdown[key] += 1;
    }
  }

  return {
    score: Math.round((100 * points) / considered),
    considered,
    breakdown,
  };
}
