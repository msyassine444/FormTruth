// Explainable, deterministic consistency semantics.
// No AI. Same statuses in, same explanation out.

'use strict';

import { STATUS } from './compare.js';

export function explainStatus(status) {
  switch (status) {
    case STATUS.MATCH:
      return 'This value matches your Truth Profile.';
    case STATUS.CONFLICT:
      return 'Your Truth Profile contains a different value for this field.';
    case STATUS.UNKNOWN:
      return 'FormTruth could not confidently verify this field.';
    case STATUS.EMPTY:
      return 'This field is empty. FormTruth cannot verify it yet.';
    default:
      return 'Unknown status.';
  }
}

export function explainEntry(entry) {
  if (!entry) {
    return '';
  }

  switch (entry.status) {
    case STATUS.CONFLICT:
      return 'CONFLICT: Your Truth Profile contains a different value.';
    case STATUS.UNKNOWN:
      if (entry.expected !== null && entry.expected !== undefined && entry.expected !== '') {
        return 'UNKNOWN: FormTruth could not confidently compare this field.';
      }

      return 'UNKNOWN: FormTruth could not confidently identify this field.';
    case STATUS.EMPTY:
      return 'EMPTY: fill this field to verify it.';
    default:
      return explainStatus(entry.status);
  }
}
