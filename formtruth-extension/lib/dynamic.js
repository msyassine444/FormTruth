// Dynamic form support.
//
// Forms frequently inject fields after the initial page load
// (multi-step wizards, SPA frameworks). Rather than continuously
// re-scanning the whole page (expensive, risky), we install a
// lightweight MutationObserver in the page that only records
// whether something *relevant to forms* changed. The popup shows
// a "page changed — scan again" hint and the next manual Scan
// picks up the new fields, exactly like a fresh scan.

'use strict';

const DIRTY_FLAG = '__formtruth_dirty';
const INSTALLED_FLAG = '__formtruth_watcher';

const RELEVANT_ATTRIBUTES = [
  'name',
  'id',
  'autocomplete',
  'placeholder',
  'aria-label',
  'aria-labelledby',
  'type',
];

function nodeLooksLikeField(node) {
  if (!node || node.nodeType !== 1) {
    return false;
  }

  const tag = (node.tagName || '').toUpperCase();

  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'FORM') {
    return true;
  }

  return (
    typeof node.querySelector === 'function' &&
    Boolean(node.querySelector('input, textarea, select, form'))
  );
}

/** Pure helper: is this mutation record relevant to form fields? */
export function mutationRecordIsRelevant(record) {
  if (!record) {
    return false;
  }

  if (record.type === 'attributes') {
    return RELEVANT_ATTRIBUTES.indexOf(record.attributeName) !== -1;
  }

  if (record.type === 'childList') {
    for (const node of record.addedNodes || []) {
      if (nodeLooksLikeField(node)) {
        return true;
      }
    }

    for (const node of record.removedNodes || []) {
      if (nodeLooksLikeField(node)) {
        return true;
      }
    }
  }

  return false;
}

/*
 * Self-contained page-side installer. Safe to pass to
 * chrome.scripting.executeScript({ func }) because it does
 * not reference any module-scope value.
 */
export function installDynamicFormWatcher() {
  const DIRTY = '__formtruth_dirty';
  const INSTALLED = '__formtruth_watcher';

  if (window[INSTALLED]) {
    return false;
  }

  window[INSTALLED] = true;
  window[DIRTY] = false;

  function relevantNode(node) {
    if (!node || node.nodeType !== 1) {
      return false;
    }

    const tag = (node.tagName || '').toUpperCase();

    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      tag === 'FORM'
    ) {
      return true;
    }

    return (
      typeof node.querySelector === 'function' &&
      Boolean(node.querySelector('input, textarea, select, form'))
    );
  }

  const ATTRIBUTES = [
    'name',
    'id',
    'autocomplete',
    'placeholder',
    'aria-label',
    'aria-labelledby',
    'type',
  ];

  const observer = new MutationObserver((records) => {
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];

      if (record.type === 'attributes') {
        if (ATTRIBUTES.indexOf(record.attributeName) !== -1) {
          window[DIRTY] = true;
          return;
        }

        continue;
      }

      const lists = [record.addedNodes, record.removedNodes];

      for (let j = 0; j < lists.length; j += 1) {
        const nodes = lists[j];

        if (!nodes) {
          continue;
        }

        for (let k = 0; k < nodes.length; k += 1) {
          if (relevantNode(nodes[k])) {
            window[DIRTY] = true;
            return;
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ATTRIBUTES,
  });

  return true;
}

/* Self-contained page-side reader (does not clear; cleared on next scan). */
export function readDynamicFormsDirty() {
  return Boolean(window.__formtruth_dirty);
}

/* Self-contained page-side marker: call after a successful scan. */
export function markDynamicFormsScanned() {
  window.__formtruth_dirty = false;
  return true;
}
