import { profileGroups, labelFor } from './lib/canonicalize.js';
import { identifyField } from './lib/identify.js';
import { STATUS, compareField, summarize } from './lib/compare.js';
import {
  parseProfileText,
  hasProfile,
  profileToText,
} from './lib/profile.js';
import {
  createProfileStore,
  createHistoryStore,
  createSettingsStore,
} from './lib/storage.js';
import { copyText } from './lib/clipboard.js';
import {
  buildReport,
  serializeReport,
  suggestFilename,
} from './lib/exporter.js';
import {
  installDynamicFormWatcher,
  readDynamicFormsDirty,
  markDynamicFormsScanned,
} from './lib/dynamic.js';
import { deduplicateEntries } from './lib/dedupe.js';
import { installFirewall } from './lib/firewall.js';
import { explainEntry } from './lib/explain.js';
import { computeScore } from './lib/score.js';

const $ = (id) => document.getElementById(id);

const store = createProfileStore();
const historyStore = createHistoryStore();
const settingsStore = createSettingsStore();

let profile = {};
let settings = {
  countryPrefix: '212',
  firewallEnabled: true,
  historyRetention: 20,
};
let currentEntries = [];
let lastScanMeta = {
  url: '',
  title: '',
};

/* ------------------------------------------------------------------ *
 * Injected into the page
 * ------------------------------------------------------------------ */

function collectRawFields() {
  const SKIP = [
    'hidden',
    'password',
    'submit',
    'button',
    'reset',
    'file',
    'checkbox',
    'radio',
    'image',
    'range',
    'color',
  ];

  const nodes = document.querySelectorAll(
    'input, textarea, select'
  );

  const out = [];

  for (let i = 0; i < nodes.length; i += 1) {
    const el = nodes[i];

    const type =
      (el.type || '').toLowerCase();

    if (
      el.disabled ||
      SKIP.indexOf(type) !== -1
    ) {
      continue;
    }

    const autocomplete =
      el.getAttribute('autocomplete') || '';

    const nameId =
      (el.name || '') +
      ' ' +
      (el.id || '');

    if (
      /\bcc-/.test(
        autocomplete.toLowerCase()
      ) ||
      /card|cvv|cvc|iban/i.test(nameId)
    ) {
      continue;
    }

    let label = '';

    if (el.labels && el.labels[0]) {
      label = (
        el.labels[0].textContent || ''
      )
        .trim()
        .slice(0, 80);
    }

    /*
     * aria-labelledby is the highest-priority explicit
     * accessible-name signal after a native <label>.
     * Resolve the referenced element IDs safely: missing
     * or broken references simply yield no text.
     */
    let ariaLabelledby = '';

    const labelledByAttr =
      el.getAttribute(
        'aria-labelledby'
      ) || '';

    if (labelledByAttr) {
      const parts = [];

      labelledByAttr
        .split(/\s+/)
        .forEach((id) => {
          if (!id) {
            return;
          }

          const ref =
            document.getElementById(
              id
            );

          if (
            ref &&
            ref.textContent
          ) {
            parts.push(
              ref.textContent
                .trim()
            );
          }
        });

      ariaLabelledby =
        parts
          .join(' ')
          .trim()
          .slice(0, 80);
    }

    if (!label) {
      label =
        ariaLabelledby;
    }

    if (!label) {
      label = (
        el.getAttribute('aria-label') || ''
      )
        .trim()
        .slice(0, 80);
    }

    let value = el.value || '';

    if (
      el.tagName === 'SELECT' &&
      el.selectedOptions &&
      el.selectedOptions[0]
    ) {
      value =
        el.selectedOptions[0].text;
    }

    const idx = out.length;

    el.setAttribute(
      'data-ft-idx',
      String(idx)
    );

    out.push({
      idx,
      name: el.name || '',
      id: el.id || '',
      type,
      autocomplete,
      placeholder:
        el.getAttribute('placeholder') || '',
      label,
      ariaLabel:
        el.getAttribute('aria-label') || '',
      ariaLabelledby:
        ariaLabelledby,
      value: String(
        value == null ? '' : value
      ).trim(),
    });
  }

  return out;
}

function highlightField(idx) {
  const el = document.querySelector(
    '[data-ft-idx="' + idx + '"]'
  );

  if (!el) {
    return false;
  }

  try {
    el.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    });
  } catch (e) {
    /* ignore */
  }

  const prev =
    el.style.outline;

  el.style.outline =
    '3px solid #d1a04a';

  setTimeout(() => {
    el.style.outline = prev;
  }, 2000);

  return true;
}

/* ------------------------------------------------------------------ *
 * Theme
 * ------------------------------------------------------------------ */

function applyTheme(theme) {
  document.documentElement.setAttribute(
    'data-theme',
    theme
  );

  $('theme-toggle').textContent =
    theme === 'dark'
      ? '☀️'
      : '🌙';
}

async function initTheme() {
  const { theme } =
    await chrome.storage.local.get(
      'theme'
    );

  const prefersDark =
    window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

  applyTheme(
    theme ||
    (prefersDark
      ? 'dark'
      : 'light')
  );

  $('theme-toggle')
    .addEventListener(
      'click',
      async () => {
        const next =
          document.documentElement
            .getAttribute(
              'data-theme'
            ) === 'dark'
            ? 'light'
            : 'dark';

        applyTheme(next);

        await chrome.storage.local.set({
          theme: next,
        });
      }
    );
}

/* ------------------------------------------------------------------ *
 * Tabs
 * ------------------------------------------------------------------ */

function initTabs() {
  document
    .querySelectorAll(
      '.ft-tabs button'
    )
    .forEach((btn) => {
      btn.addEventListener(
        'click',
        async () => {
          document
            .querySelectorAll(
              '.ft-tabs button'
            )
            .forEach((b) => {
              b.setAttribute(
                'aria-selected',
                String(b === btn)
              );
            });

          $('view-profile').hidden =
            btn.dataset.view !==
            'profile';

          $('view-scan').hidden =
            btn.dataset.view !==
            'scan';

          $('view-history').hidden =
            btn.dataset.view !==
            'history';

          if (
            btn.dataset.view ===
            'history'
          ) {
            await renderHistory();
          }

          if (
            btn.dataset.view ===
            'scan'
          ) {
            await checkDynamicDirty();
          }
        }
      );
    });
}

/* ------------------------------------------------------------------ *
 * Small UI helpers
 * ------------------------------------------------------------------ */

function setImportStatus(message) {
  $('import-status').textContent =
    message;
}

function flash(button, text) {
  const original =
    button.textContent;

  button.textContent = text;

  setTimeout(() => {
    button.textContent =
      original;
  }, 1200);
}

function download(
  filename,
  text
) {
  const blob = new Blob(
    [text],
    {
      type: 'application/json',
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/* ------------------------------------------------------------------ *
 * Profile ledger
 * ------------------------------------------------------------------ */

function buildLedger() {
  const root = $('ledger');

  root.textContent = '';

  profileGroups().forEach(
    (group) => {
      const wrap =
        document.createElement(
          'div'
        );

      wrap.className =
        'ft-group';

      const heading =
        document.createElement(
          'h2'
        );

      heading.textContent =
        group.group;

      wrap.appendChild(heading);

      group.fields.forEach(
        (field) => {
          const row =
            document.createElement(
              'label'
            );

          row.className =
            'ft-field';

          const caption =
            document.createElement(
              'span'
            );

          caption.textContent =
            field.label;

          const input =
            document.createElement(
              'input'
            );

          input.id =
            'f-' +
            field.canonical;

          input.type =
            field.type === 'email'
              ? 'email'
              : field.type === 'phone'
                ? 'tel'
                : 'text';

          input.placeholder =
            field.placeholder || '';

          input.autocomplete =
            'off';

          row.append(
            caption,
            input
          );

          wrap.appendChild(row);
        }
      );

      root.appendChild(wrap);
    }
  );
}

function fillLedger(
  fromProfile
) {
  profileGroups().forEach(
    (group) => {
      group.fields.forEach(
        (field) => {
          const el =
            $('f-' +
              field.canonical);

          if (el) {
            el.value =
              fromProfile[
                field.canonical
              ] || '';
          }
        }
      );
    }
  );
}

function readLedger() {
  const next = {};

  profileGroups().forEach(
    (group) => {
      group.fields.forEach(
        (field) => {
          const el =
            $('f-' +
              field.canonical);

          if (el) {
            next[
              field.canonical
            ] =
              el.value.trim();
          }
        }
      );
    }
  );

  Object.keys(profile).forEach(
    (key) => {
      if (
        !(key in next) &&
        profile[key]
      ) {
        next[key] =
          profile[key];
      }
    }
  );

  return next;
}

/* ------------------------------------------------------------------ *
 * Truth Profile
 * ------------------------------------------------------------------ */

async function refreshProfileSelector() {
  const select = $('profile-select');

  if (!select) {
    return;
  }

  const { names, active } =
    await store.list();

  select.textContent = '';

  names.forEach((name) => {
    const option =
      document.createElement(
        'option'
      );

    option.value = name;

    option.textContent = name;

    if (name === active) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

function applySettingsToUI() {
  const country = $('setting-country');
  const firewall = $('setting-firewall');

  if (country) {
    country.value = settings.countryPrefix;
  }

  if (firewall) {
    firewall.checked = settings.firewallEnabled !== false;
  }
}

async function loadProfile() {
  settings =
    await settingsStore.load();

  applySettingsToUI();

  profile =
    await store.loadActive();

  fillLedger(profile);

  await refreshProfileSelector();

  setImportStatus(
    hasProfile(profile)
      ? `Profile loaded (${Object.keys(profile).length} field(s)).`
      : 'No profile yet. Fill it in or import one.'
  );
}

async function saveProfile() {
  profile =
    readLedger();

  await store.saveActive(profile);

  flash(
    $('save-profile'),
    'Saved'
  );

  setImportStatus(
    'Profile saved locally.'
  );
}

async function clearProfile() {
  await store.clear();

  profile = {};

  fillLedger(profile);

  setImportStatus(
    'Stored profile deleted.'
  );
}

async function applyImport(text) {
  let result;

  try {
    result =
      parseProfileText(text);
  } catch (err) {
    setImportStatus(
      'Import failed: invalid JSON.'
    );

    return;
  }

  if (
    !hasProfile(
      result.profile
    )
  ) {
    setImportStatus(
      'Import failed: no recognized fields found.'
    );

    return;
  }

  profile = {
    ...profile,
    ...result.profile,
  };

  await store.saveActive(profile);

  fillLedger(profile);

  const count =
    Object.keys(
      result.profile
    ).length;

  const ignored =
    result.ignored.length
      ? ` · ignored: ${result.ignored.join(', ')}`
      : '';

  setImportStatus(
    `Imported ${count} field(s)${ignored}.`
  );
}

/* ------------------------------------------------------------------ *
 * Scan
 * ------------------------------------------------------------------ */

const TAGS = {
  MATCH: 'Match',
  CONFLICT: 'Conflict',
  UNKNOWN: 'Unknown',
  EMPTY: 'Empty',
};

const ORDER = {
  CONFLICT: 0,
  UNKNOWN: 1,
  EMPTY: 2,
  MATCH: 3,
};

async function watchDynamicForms(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: installDynamicFormWatcher,
    });

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: markDynamicFormsScanned,
    });
  } catch (err) {
    /* restricted pages */
  }
}

async function checkDynamicDirty() {
  const hint = $('scan-dirty-hint');

  if (!hint) {
    return;
  }

  try {
    const tab = await getActiveTab();

    if (!tab || !tab.id) {
      return;
    }

    const frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: readDynamicFormsDirty,
    });

    const dirty = (frames || []).some(
      (frame) => frame.result === true
    );

    hint.hidden = !dirty;

    if (dirty) {
      hint.textContent =
        'The page changed since the last scan — press "Scan this page" again for up-to-date results.';
    }
  } catch (err) {
    /* ignore */
  }
}

async function getActiveTab() {
  const [tab] =
    await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

  return tab;
}

function isPresent(value) {
  return (
    value !== null &&
    value !== undefined
  );
}

function reportBadge(counts, tabId) {
  try {
    const pending =
      chrome.runtime.sendMessage({
        type: 'SCAN_RESULT',
        payload: {
          matches:
            counts.MATCH,
          conflicts:
            counts.CONFLICT,
          unknown:
            counts.UNKNOWN,
          tabId:
            tabId,
        },
      });

    if (
      pending &&
      pending.catch
    ) {
      pending.catch(
        () => {}
      );
    }
  } catch (err) {
    /* service worker may be asleep */
  }
}

function detail(
  labelA,
  valueA,
  labelB,
  valueB
) {
  const node =
    document.createElement(
      'div'
    );

  node.className =
    'ft-r-detail';

  if (labelA) {
    node.append(labelA);
  }

  if (isPresent(valueA)) {
    const b =
      document.createElement(
        'b'
      );

    b.textContent =
      String(valueA);

    node.appendChild(b);
  }

  if (labelB) {
    node.append(
      '  ·  '
    );

    node.append(labelB);
  }

  if (isPresent(valueB)) {
    const b =
      document.createElement(
        'b'
      );

    b.textContent =
      String(valueB);

    node.appendChild(b);
  }

  return node;
}

function renderEntry(entry) {
  const li =
    document.createElement(
      'li'
    );

  li.className =
    entry.status.toLowerCase();

  const head =
    document.createElement(
      'div'
    );

  head.className =
    'ft-r-head';

  const name =
    document.createElement(
      'span'
    );

  name.textContent =
    labelFor(entry.field);

  const tag =
    document.createElement(
      'span'
    );

  tag.className =
    'ft-tag';

  tag.textContent =
    TAGS[entry.status] ||
    entry.status;

  head.append(
    name,
    tag
  );

  li.appendChild(head);

  /* Plain-language explanation (Phase 7). */
  let explanation = '';

  try {
    explanation = explainEntry(entry);
  } catch (err) {
    explanation = '';
  }

  if (explanation) {
    const note = document.createElement('p');

    note.className = 'ft-r-explain';

    note.textContent = explanation;

    li.appendChild(note);
  }

  if (
    entry.status ===
    STATUS.CONFLICT
  ) {
    li.appendChild(
      detail(
        'In the form: ',
        entry.actual,
        'Profile: ',
        entry.expected
      )
    );
  } else if (
    entry.status ===
      STATUS.UNKNOWN &&
    isPresent(
      entry.expected
    )
  ) {
    li.appendChild(
      detail(
        'Profile has: ',
        entry.expected,
        null,
        null
      )
    );
  } else if (
    entry.status ===
      STATUS.EMPTY &&
    isPresent(
      entry.expected
    )
  ) {
    li.appendChild(
      detail(
        'Empty. Profile has: ',
        entry.expected,
        null,
        null
      )
    );
  }

  const actions =
    document.createElement(
      'div'
    );

  actions.className =
    'ft-r-actions';

  const locate =
    document.createElement(
      'button'
    );

  locate.className =
    'ft-mini';

  locate.textContent =
    'Locate';

  locate.addEventListener(
    'click',
    () =>
      highlightEntry(entry)
  );

  actions.appendChild(
    locate
  );

  if (
    isPresent(
      entry.expected
    ) &&
    String(entry.expected) !== ''
  ) {
    const copy =
      document.createElement(
        'button'
      );

    copy.className =
      'ft-mini';

    copy.textContent =
      'Copy profile value';

    copy.addEventListener(
      'click',
      async () => {
        const ok =
          await copyText(
            String(
              entry.expected
            )
          );

        copy.textContent =
          ok
            ? 'Copied'
            : 'Copy failed';

        setTimeout(() => {
          copy.textContent =
            'Copy profile value';
        }, 1200);
      }
    );

    actions.appendChild(
      copy
    );
  }

  li.appendChild(
    actions
  );

  return li;
}

async function highlightEntry(
  entry
) {
  const tab =
    await getActiveTab();

  if (
    !tab ||
    !tab.id
  ) {
    return;
  }

  try {
    await chrome.scripting.executeScript(
      {
        target: {
          tabId: tab.id,
          frameIds: [
            entry.frameId,
          ],
        },
        func: highlightField,
        args: [
          entry.idx,
        ],
      }
    );
  } catch (err) {
    /* frame may have navigated away */
  }
}

function exportReport() {
  if (
    !currentEntries.length
  ) {
    $('scan-summary').textContent =
      'Scan the page first to export a report.';

    return;
  }

  let host = '';

  try {
    host =
      new URL(
        lastScanMeta.url
      ).hostname;
  } catch (err) {
    host = '';
  }

  download(
    suggestFilename(host),
    serializeReport(
      buildReport(
        currentEntries,
        lastScanMeta
      )
    )
  );
}

/* ------------------------------------------------------------------ *
 * History helpers
 * ------------------------------------------------------------------ */

function formatHistoryDate(
  timestamp
) {
  if (!timestamp) {
    return 'Unknown time';
  }

  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Unknown time';
  }

  return date.toLocaleString();
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (err) {
    return url || 'Unknown site';
  }
}

function createHistoryStat(
  className,
  icon,
  label,
  value
) {
  const stat =
    document.createElement(
      'span'
    );

  stat.className =
    `ft-history-stat ${className}`;

  stat.append(
    `${icon} ${label}: ${value}`
  );

  return stat;
}

function createConflictElement(
  conflict
) {
  const wrap =
    document.createElement(
      'div'
    );

  wrap.className =
    'ft-history-conflict';

  const field =
    document.createElement(
      'div'
    );

  field.className =
    'ft-history-conflict-field';

  field.textContent =
    labelFor(
      conflict.field
    );

  wrap.appendChild(field);

  const note = document.createElement('div');

  note.className = 'ft-history-conflict-row';

  note.textContent =
    'Conflicting value detected (details stay on the page, not in history).';

  wrap.appendChild(note);

  return wrap;
}

function createHistoryCard(
  entry
) {
  const card =
    document.createElement(
      'article'
    );

  card.className =
    'ft-history-card';

  const header =
    document.createElement(
      'div'
    );

  header.className =
    'ft-history-card-header';

  const site =
    document.createElement(
      'div'
    );

  site.className =
    'ft-history-site';

  const title =
    document.createElement(
      'div'
    );

  title.className =
    'ft-history-title';

  title.textContent =
    entry.title ||
    safeHostname(
      entry.url
    );

  const url =
    document.createElement(
      'div'
    );

  url.className =
    'ft-history-url';

  url.textContent =
    safeHostname(
      entry.url
    );

  site.append(
    title,
    url
  );

  const time =
    document.createElement(
      'div'
    );

  time.className =
    'ft-history-time';

  time.textContent =
    formatHistoryDate(
      entry.timestamp
    );

  header.append(
    site,
    time
  );

  card.appendChild(header);

  const summary =
    document.createElement(
      'div'
    );

  summary.className =
    'ft-history-summary';

  summary.appendChild(
    createHistoryStat(
      'match',
      '✓',
      'Match',
      entry.summary.match
    )
  );

  summary.appendChild(
    createHistoryStat(
      'conflict',
      '!',
      'Conflict',
      entry.summary.conflict
    )
  );

  summary.appendChild(
    createHistoryStat(
      'unknown',
      '?',
      'Unknown',
      entry.summary.unknown
    )
  );

  if (
    typeof entry.summary.score ===
    'number'
  ) {
    summary.appendChild(
      createHistoryStat(
        'score',
        '★',
        'Score',
        `${entry.summary.score}/100`
      )
    );
  }

  card.appendChild(summary);

  if (
    entry.conflicts &&
    entry.conflicts.length
  ) {
    const details =
      document.createElement(
        'details'
      );

    details.className =
      'ft-history-details';

    const detailsSummary =
      document.createElement(
        'summary'
      );

    detailsSummary.textContent =
      `${entry.conflicts.length} conflict(s)`;

    details.appendChild(
      detailsSummary
    );

    const conflicts =
      document.createElement(
        'div'
      );

    conflicts.className =
      'ft-history-conflicts';

    entry.conflicts.forEach(
      (conflict) => {
        conflicts.appendChild(
          createConflictElement(
            conflict
          )
        );
      }
    );

    details.appendChild(
      conflicts
    );

    card.appendChild(
      details
    );
  }

  const footer =
    document.createElement(
      'div'
    );

  footer.className =
    'ft-history-footer';

  const deleteButton =
    document.createElement(
      'button'
    );

  deleteButton.className =
    'ft-history-delete';

  deleteButton.textContent =
    'Delete';

  deleteButton.addEventListener(
    'click',
    async () => {
      const history =
        await historyStore.load();

      const next =
        history.filter(
          (item) =>
            item.id !== entry.id
        );

      await chrome.storage.local.set(
        {
          requestHistory: next,
        }
      );

      await renderHistory();
    }
  );

  footer.appendChild(
    deleteButton
  );

  card.appendChild(footer);

  return card;
}

async function renderHistory() {
  const list =
    $('history-list');

  const status =
    $('history-status');

  list.textContent = '';

  const history =
    await historyStore.load();

  if (!history.length) {
    status.textContent =
      'No scans yet. Scan a form and it will appear here.';

    const empty =
      document.createElement(
        'div'
      );

    empty.className =
      'ft-history-empty';

    empty.textContent =
      'Your scan history is empty.';

    list.appendChild(empty);

    return;
  }

  status.textContent =
    `${history.length} scan(s) stored locally.`;

  history.forEach(
    (entry) => {
      list.appendChild(
        createHistoryCard(entry)
      );
    }
  );
}

async function clearHistory() {
  await historyStore.clear();

  await renderHistory();
}

/* ------------------------------------------------------------------ *
 * Scan History
 * ------------------------------------------------------------------ */

async function saveScanToHistory(
  counts,
  score
) {
  await historyStore.add({
    url: lastScanMeta.url,
    title: lastScanMeta.title,

    summary: {
      match:
        counts.MATCH,
      conflict:
        counts.CONFLICT,
      unknown:
        counts.UNKNOWN,
      score:
        typeof score === 'number'
          ? score
          : null,
    },

    /* Privacy-safe: field names only, never the personal values. */
    conflicts:
      currentEntries
        .filter(
          (entry) =>
            entry.status ===
            STATUS.CONFLICT
        )
        .map(
          (entry) => ({
            field:
              entry.field,
          })
        ),
  });
}

/* ------------------------------------------------------------------ *
 * Scan
 * ------------------------------------------------------------------ */

async function scan() {
  const button =
    $('scan-btn');

  const list =
    $('results');

  const summary =
    $('scan-summary');

  list.textContent = '';

  summary.textContent = '';

  if (!hasProfile(profile)) {
    summary.textContent =
      'Your profile is empty. Fill it in on the Profile tab and save it first.';

    return;
  }

  button.disabled = true;

  button.textContent =
    'Scanning...';

  try {
    const tab =
      await getActiveTab();

    if (
      !tab ||
      !tab.id
    ) {
      throw new Error(
        'No active tab'
      );
    }

    lastScanMeta = {
      url: tab.url || '',
      title: tab.title || '',
    };

    const frames =
      await chrome.scripting.executeScript(
        {
          target: {
            tabId: tab.id,
            allFrames: true,
          },
          func: collectRawFields,
        }
      );

    currentEntries = [];

    for (
      const frame of frames
    ) {
      const rawFields =
        frame.result || [];

      for (
        const raw of rawFields
      ) {
        const canonical =
          identifyField(raw);

        if (!canonical) {
          continue;
        }

        const expected =
          profile[canonical];

        currentEntries.push({
          frameId:
            frame.frameId,

          idx:
            raw.idx,

          field:
            canonical,

          label:
            raw.label ||
            labelFor(
              canonical
            ),

          expected:
            expected ===
            undefined
              ? null
              : expected,

          actual:
            raw.value,

          status:
            compareField(
              expected,
              raw.value,
              settings.countryPrefix
            ),
        });
      }
    }

    currentEntries = deduplicateEntries(
      currentEntries
    );

    if (
      !currentEntries.length
    ) {
      summary.textContent =
        'No form fields on this page matched your profile.';

      return;
    }

    const counts =
      summarize(
        currentEntries
      );

    const scoreResult =
      computeScore(
        currentEntries
      );

    if (settings.firewallEnabled !== false) {
      installFirewall(
        currentEntries.filter(
          (entry) =>
            entry.status ===
            STATUS.CONFLICT
        ),
        tab.id
      );
    }

    summary.textContent =
      `${counts.MATCH} match · ${counts.CONFLICT} conflict · ${counts.UNKNOWN} unknown · ${counts.EMPTY} empty` +
      (scoreResult.score === null
        ? ''
        : ` · Score ${scoreResult.score}/100`);

    await saveScanToHistory(
      counts,
      scoreResult.score
    );

    currentEntries
      .slice()
      .sort(
        (a, b) =>
          ORDER[a.status] -
          ORDER[b.status]
      )
      .forEach(
        (entry) => {
          list.appendChild(
            renderEntry(entry)
          );
        }
      );

    reportBadge(counts, tab.id);

    await watchDynamicForms(tab.id);
  } catch (err) {
    summary.textContent =
      "Can't scan this page (browser pages and the Web Store block extensions).";
  } finally {
    button.disabled = false;

    button.textContent =
      '🔍 Scan this page';
  }
}

/* ------------------------------------------------------------------ *
 * Bootstrap
 * ------------------------------------------------------------------ */

async function init() {
  buildLedger();

  initTabs();

  await initTheme();

  await loadProfile();

  $('save-profile')
    .addEventListener(
      'click',
      saveProfile
    );

  $('profile-select')
    .addEventListener(
      'change',
      async (event) => {
        await store.setActive(
          event.target.value
        );

        profile =
          await store.loadActive();

        fillLedger(profile);

        setImportStatus(
          `Switched to profile "${event.target.value}".`
        );
      }
    );

  $('profile-new')
    .addEventListener(
      'click',
      async () => {
        const name =
          window.prompt(
            'New profile name:',
            ''
          );

        if (!name || !name.trim()) {
          return;
        }

        await store.addProfile(
          name.trim()
        );

        await store.setActive(
          name.trim()
        );

        profile = {};

        fillLedger(profile);

        await refreshProfileSelector();

        setImportStatus(
          `Profile "${name.trim()}" created and active.`
        );
      }
    );

  $('profile-delete')
    .addEventListener(
      'click',
      async () => {
        const { names, active } =
          await store.list();

        if (names.length <= 1) {
          setImportStatus(
            'Cannot delete the last profile.'
          );

          return;
        }

        if (
          !window.confirm(
            `Delete profile "${active}"?`
          )
        ) {
          return;
        }

        await store.deleteProfile(
          active
        );

        profile =
          await store.loadActive();

        fillLedger(profile);

        await refreshProfileSelector();

        setImportStatus(
          'Profile deleted.'
        );
      }
    );

  $('setting-save')
    .addEventListener(
      'click',
      async () => {
        settings =
          await settingsStore.save(
            {
              countryPrefix:
                $('setting-country')
                  .value,
              firewallEnabled:
                $('setting-firewall')
                  .checked,
            }
          );

        $('setting-status').textContent =
          'Settings saved locally.';
      }
    );

  $('clear-profile')
    .addEventListener(
      'click',
      clearProfile
    );

  $('scan-btn')
    .addEventListener(
      'click',
      scan
    );

  $('export-report')
    .addEventListener(
      'click',
      exportReport
    );

  $('clear-history')
    .addEventListener(
      'click',
      clearHistory
    );

  $('export-profile')
    .addEventListener(
      'click',
      () => {
        download(
          'formtruth-profile.json',
          profileToText(
            readLedger()
          )
        );
      }
    );

  $('import-apply')
    .addEventListener(
      'click',
      () => {
        const text =
          $('import-text')
            .value
            .trim();

        if (!text) {
          setImportStatus(
            'Paste a profile JSON first.'
          );

          return;
        }

        applyImport(text);
      }
    );

  $('import-file')
    .addEventListener(
      'change',
      async (event) => {
        const file =
          event.target.files &&
          event.target.files[0];

        if (!file) {
          return;
        }

        applyImport(
          await file.text()
        );
      }
    );
}

init();
