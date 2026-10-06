import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeProfile,
  parseProfileText,
  hasProfile,
  buildPortableProfile,
  profileToText,
  PROFILE_SCHEMA,
} from '../lib/profile.js';

test('imports a raw /build-truth response', () => {
  const { profile, ignored } = normalizeProfile({
    truth: { name: 'Sara', email: 'sara@example.com' },
    warnings: [],
  });
  assert.equal(profile.name, 'Sara');
  assert.equal(profile.email, 'sara@example.com');
  assert.deepEqual(ignored, []);
});

test('imports a portable profile object', () => {
  const { profile } = normalizeProfile({
    schema: PROFILE_SCHEMA,
    profile: { custname: 'Sara', custtel: '0612345678' },
  });
  assert.equal(profile.name, 'Sara');
  assert.equal(profile.phone, '0612345678');
});

test('imports a bare field map', () => {
  const { profile } = normalizeProfile({ full_name: 'Sara', phone: '0612345678' });
  assert.equal(profile.name, 'Sara');
  assert.equal(profile.phone, '0612345678');
});

test('canonicalizes unknown-but-aliasable keys and reports truly unknown ones', () => {
  const { profile, ignored } = normalizeProfile({ name: 'Sara', mystery: 'x' });
  assert.equal(profile.name, 'Sara');
  assert.deepEqual(ignored, ['mystery']);
});

test('skips blank values', () => {
  const { profile } = normalizeProfile({ name: 'Sara', email: '   ' });
  assert.equal('email' in profile, false);
});

test('parseProfileText reports invalid JSON', () => {
  assert.throws(() => parseProfileText('{oops'));
});

test('parseProfileText parses valid JSON', () => {
  const { profile } = parseProfileText('{"truth":{"name":"Sara"}}');
  assert.equal(profile.name, 'Sara');
});

test('hasProfile detects an empty vs filled profile', () => {
  assert.equal(hasProfile({}), false);
  assert.equal(hasProfile({ name: '' }), false);
  assert.equal(hasProfile({ name: 'Sara' }), true);
});

test('portable profile round-trips', () => {
  const parsed = JSON.parse(profileToText({ name: 'Sara' }));
  assert.equal(parsed.schema, PROFILE_SCHEMA);
  assert.equal(parsed.profile.name, 'Sara');
  assert.equal(buildPortableProfile({ email: 'a@b.c' }).profile.email, 'a@b.c');
});
