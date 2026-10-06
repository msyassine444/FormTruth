import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createProfileStore,
  createHistoryStore,
  PROFILE_KEY,
  HISTORY_KEY,
} from '../lib/storage.js';

function memoryArea() {
  const data = {};

  return {
    _data: data,

    async get(key) {
      return { [key]: data[key] };
    },

    async set(obj) {
      Object.assign(data, obj);
    },

    async remove(key) {
      delete data[key];
    },
  };
}

test('save then load round-trips', async () => {
  const store = createProfileStore(memoryArea());

  await store.save({ name: 'Sara' });

  assert.deepEqual(await store.load(), { name: 'Sara' });
});

test('load returns an empty object when nothing is stored', async () => {
  const store = createProfileStore(memoryArea());

  assert.deepEqual(await store.load(), {});
});

function arrayAwareMemoryArea() {
  const data = {};

  return {
    _data: data,

    async get(key) {
      if (Array.isArray(key)) {
        const out = {};

        for (const k of key) {
          out[k] = data[k];
        }

        return out;
      }

      return { [key]: data[key] };
    },

    async set(obj) {
      Object.assign(data, obj);
    },

    async remove(key) {
      if (Array.isArray(key)) {
        for (const k of key) {
          delete data[k];
        }

        return;
      }

      delete data[key];
    },
  };
}

test('clear removes the stored profile (privacy: delete)', async () => {
  const area = memoryArea();
  const store = createProfileStore(area);

  await store.save({ name: 'Sara' });
  await store.clear();

  assert.deepEqual(await store.load(), {});
  assert.equal(PROFILE_KEY in area._data, false);
});

test('stores under the truthProfile key', async () => {
  const area = memoryArea();
  const store = createProfileStore(area);

  await store.save({ name: 'Sara' });

  assert.deepEqual(area._data[PROFILE_KEY], { name: 'Sara' });
});

test('history starts empty', async () => {
  const store = createHistoryStore(memoryArea());

  assert.deepEqual(await store.load(), []);
});

test('history add then load round-trips', async () => {
  const store = createHistoryStore(memoryArea());

  const entry = await store.add({
    id: 'scan-1',
    timestamp: '2026-10-05T08:00:00.000Z',
    url: 'https://example.com/form',
    title: 'Example Form',
    summary: {
      match: 3,
      conflict: 1,
      unknown: 2,
    },
    conflicts: [
      {
        field: 'email',
        truth: 'a@example.com',
        form: 'wrong@example.com',
      },
    ],
  });

  assert.equal(entry.id, 'scan-1');
  assert.deepEqual(await store.load(), [entry]);
});

test('new history entries are stored first', async () => {
  const store = createHistoryStore(memoryArea());

  await store.add({
    id: 'scan-1',
    url: 'https://example.com/1',
    summary: {
      match: 1,
      conflict: 0,
      unknown: 0,
    },
  });

  await store.add({
    id: 'scan-2',
    url: 'https://example.com/2',
    summary: {
      match: 2,
      conflict: 1,
      unknown: 0,
    },
  });

  const history = await store.load();

  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'scan-2');
  assert.equal(history[1].id, 'scan-1');
});

test('clear removes all history (privacy: delete)', async () => {
  const area = memoryArea();
  const store = createHistoryStore(area);

  await store.add({
    id: 'scan-1',
    url: 'https://example.com',
    summary: {
      match: 1,
      conflict: 0,
      unknown: 0,
    },
  });

  await store.clear();

  assert.deepEqual(await store.load(), []);
  assert.equal(HISTORY_KEY in area._data, false);
});
test('multi-profile: defaults to Personal, then tracks active', async () => {
  const area = arrayAwareMemoryArea();
  const store = createProfileStore(area);

  await store.save({ name: 'Sara' });

  const listed = await store.list();

  assert.deepEqual(listed.names, ['Personal']);
  assert.equal(listed.active, 'Personal');

  await store.addProfile('Work');
  await store.setActive('Work');

  await store.saveActive({ company: 'Acme' });

  assert.deepEqual(await store.loadActive(), { company: 'Acme' });
  assert.deepEqual((await store.activeProfile()).profile, { company: 'Acme' });

  await store.setActive('Personal');
  assert.deepEqual(await store.loadActive(), { name: 'Sara' });
});

test('multi-profile: delete switches active and never leaves zero profiles', async () => {
  const area = arrayAwareMemoryArea();
  const store = createProfileStore(area);

  await store.addProfile('School');
  await store.setActive('School');
  await store.saveActive({ university: 'X' });

  const next = await store.deleteProfile('School');

  assert.equal(next, 'Personal');

  const listed = await store.list();

  assert.deepEqual(listed.names, ['Personal']);
});

test('settings store returns safe defaults and merges saves', async () => {
  const { createSettingsStore } = await import('../lib/storage.js');
  const area = arrayAwareMemoryArea();
  const settings = createSettingsStore(area);

  const initial = await settings.load();

  assert.equal(initial.countryPrefix, '212');
  assert.equal(initial.firewallEnabled, true);

  const saved = await settings.save({ countryPrefix: '971' });

  assert.equal(saved.countryPrefix, '971');
  assert.equal(saved.firewallEnabled, true);

  const reloaded = await settings.load();

  assert.equal(reloaded.countryPrefix, '971');
});
