'use strict';

export const PROFILE_KEY = 'truthProfile';
export const PROFILES_KEY = 'truthProfiles';
export const ACTIVE_PROFILE_KEY = 'activeProfile';
export const HISTORY_KEY = 'requestHistory';
export const SETTINGS_KEY = 'formtruthSettings';

function defaultArea() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return chrome.storage.local;
  }
  return null;
}

export function createProfileStore(area) {
  const storage = area || defaultArea();

  if (!storage) {
    throw new Error('chrome.storage.local is unavailable');
  }

  return {
    async load() {
      const result = await storage.get(PROFILE_KEY);
      return (result && result[PROFILE_KEY]) || {};
    },

    async save(profile) {
      const clean = { ...profile };
      await storage.set({ [PROFILE_KEY]: clean });
      return clean;
    },

    async clear() {
      const { profiles, active } = await this.all();
      profiles[active] = {};
      await storage.set({ [PROFILES_KEY]: profiles });
      await storage.remove(PROFILE_KEY);
    },

    /* ---------------- Multi-profile (backward compatible) ---------------- */

    async all() {
      const result = await storage.get([
        PROFILES_KEY,
        ACTIVE_PROFILE_KEY,
        PROFILE_KEY,
      ]);

      let profiles = result && result[PROFILES_KEY];

      if (!profiles || typeof profiles !== 'object' || !Object.keys(profiles).length) {
        profiles = { Personal: (result && result[PROFILE_KEY]) || {} };
      }

      let active = result && result[ACTIVE_PROFILE_KEY];

      if (!active || !(active in profiles)) {
        active = Object.keys(profiles)[0];
      }

      return { profiles, active };
    },

    async list() {
      const { profiles, active } = await this.all();
      return { names: Object.keys(profiles), active };
    },

    async activeProfile() {
      const { profiles, active } = await this.all();
      return { name: active, profile: profiles[active] || {} };
    },

    /** Loads the ACTIVE profile (default: Personal). Backwards compatible. */
    async loadActive() {
      const { profile } = await this.activeProfile();
      return profile;
    },

    async saveActive(profile) {
      const { profiles, active } = await this.all();
      const clean = { ...profile };
      profiles[active] = clean;
      await storage.set({
        [PROFILES_KEY]: profiles,
        [ACTIVE_PROFILE_KEY]: active,
        [PROFILE_KEY]: clean,
      });
      return clean;
    },

    async setActive(name) {
      const { profiles } = await this.all();

      if (!(name in profiles)) {
        throw new Error(`Unknown profile: ${name}`);
      }

      await storage.set({
        [ACTIVE_PROFILE_KEY]: name,
        [PROFILE_KEY]: profiles[name],
      });

      return profiles[name];
    },

    async addProfile(name) {
      const key = String(name || '').trim();

      if (!key) {
        throw new Error('Profile name required');
      }

      const { profiles } = await this.all();

      if (!(key in profiles)) {
        profiles[key] = {};
        await storage.set({ [PROFILES_KEY]: profiles });
      }

      return key;
    },

    async deleteProfile(name) {
      const { profiles, active } = await this.all();

      if (!(name in profiles)) {
        return active;
      }

      delete profiles[name];

      let names = Object.keys(profiles);

      if (!names.length) {
        profiles.Personal = {};
        names = ['Personal'];
      }

      const nextActive = name === active ? names[0] : active;

      await storage.set({
        [PROFILES_KEY]: profiles,
        [ACTIVE_PROFILE_KEY]: nextActive,
        [PROFILE_KEY]: profiles[nextActive],
      });

      return nextActive;
    },
  };
}

export function createSettingsStore(area) {
  const storage = area || defaultArea();

  if (!storage) {
    throw new Error('chrome.storage.local is unavailable');
  }

  const DEFAULTS = {
    countryPrefix: '212',
    firewallEnabled: true,
    historyRetention: 20,
  };

  return {
    async load() {
      const result = await storage.get(SETTINGS_KEY);
      const stored = (result && result[SETTINGS_KEY]) || {};

      return { ...DEFAULTS, ...stored };
    },

    async save(next) {
      const current = await this.load();
      const merged = { ...current, ...(next || {}) };

      await storage.set({ [SETTINGS_KEY]: merged });

      return merged;
    },

    async clear() {
      await storage.remove(SETTINGS_KEY);
    },

    defaults: DEFAULTS,
  };
}

export function createHistoryStore(area) {
  const storage = area || defaultArea();

  if (!storage) {
    throw new Error('chrome.storage.local is unavailable');
  }

  return {
    async load() {
      const result = await storage.get(HISTORY_KEY);
      const history = result && result[HISTORY_KEY];

      return Array.isArray(history) ? history : [];
    },

    async add(entry) {
      const history = await this.load();

      const clean = {
        id:
          entry.id ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

        timestamp:
          entry.timestamp ||
          new Date().toISOString(),

        url: entry.url || '',
        title: entry.title || '',

        summary: {
          match: Number(entry.summary?.match || 0),
          conflict: Number(entry.summary?.conflict || 0),
          unknown: Number(entry.summary?.unknown || 0),
          score:
            typeof entry.summary?.score === 'number'
              ? entry.summary.score
              : null,
        },

        conflicts: Array.isArray(entry.conflicts)
          ? entry.conflicts.map((conflict) => ({ ...conflict }))
          : [],
      };

      history.unshift(clean);

      await storage.set({
        [HISTORY_KEY]: history,
      });

      return clean;
    },

    async clear() {
      await storage.remove(HISTORY_KEY);
    },
  };
}