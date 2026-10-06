/**
 * Clipboard helper with legacy fallback.
 */

'use strict';

export async function copyText(text) {
  if (!text) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through */ }

  return legacyCopy(text);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  Object.assign(ta.style, {
    position: 'fixed', top: '-1000px', left: '-1000px', opacity: '0'
  });

  document.body.appendChild(ta);
  ta.select();

  let ok = false;
  try { ok = document.execCommand('copy'); }
  catch (_) { ok = false; }
  finally { ta.remove(); }
  return ok;
}