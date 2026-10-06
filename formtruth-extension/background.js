// FormTruth - background service worker (classic).
// Single job: reflect the latest scan as a toolbar badge.
// No network calls. No form values are stored here.

'use strict';

const BADGE_COLORS = { MATCH: '#1f9d55', CONFLICT: '#dc2626', UNKNOWN: '#b45309' };

function updateBadge(tabId, result) {
  const matches = (result && result.matches) || 0;
  const conflicts = (result && result.conflicts) || 0;
  const unknown = (result && result.unknown) || 0;
  const total = matches + conflicts + unknown;

  if (total === 0) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  if (conflicts > 0) {
    chrome.action.setBadgeText({ tabId, text: String(conflicts) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS.CONFLICT });
  } else if (unknown > 0) {
    chrome.action.setBadgeText({ tabId, text: String(unknown) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS.UNKNOWN });
  } else {
    chrome.action.setBadgeText({ tabId, text: String(matches) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS.MATCH });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string') return;

  if (msg.type === 'SCAN_RESULT') {
    // The message is sent from the popup (not a content script),
    // so sender.tab is unavailable: prefer the explicit tabId
    // carried in the payload, fall back to sender.tab when present.
    const explicit =
      msg.payload &&
      typeof msg.payload.tabId === 'number'
        ? msg.payload.tabId
        : null;
    const tabId =
      explicit ??
      (sender.tab && sender.tab.id);
    if (tabId != null) updateBadge(tabId, msg.payload);
    sendResponse({ ok: true });
    return;
  }

  sendResponse({ ok: false, error: 'Unknown message type' });
});
