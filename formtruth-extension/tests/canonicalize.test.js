import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalizeField, squash, labelFor, profileGroups } from '../lib/canonicalize.js';

test('squash removes separators and lowercases', () => {
  assert.equal(squash('Full Name'), 'fullname');
  assert.equal(squash('phone_number'), 'phonenumber');
  assert.equal(squash('name[]'), 'name');
});

test('exact aliases map to the canonical field', () => {
  assert.equal(canonicalizeField('name'), 'name');
  assert.equal(canonicalizeField('custname'), 'name');
  assert.equal(canonicalizeField('full_name'), 'name');
  assert.equal(canonicalizeField('customer_name'), 'name');
  assert.equal(canonicalizeField('your_name'), 'name');
});

test('email and phone aliases', () => {
  assert.equal(canonicalizeField('custemail'), 'email');
  assert.equal(canonicalizeField('e-mail'), 'email');
  assert.equal(canonicalizeField('email_address'), 'email');
  assert.equal(canonicalizeField('custtel'), 'phone');
  assert.equal(canonicalizeField('phone_number'), 'phone');
  assert.equal(canonicalizeField('mobile'), 'phone');
});

test('first and last name aliases', () => {
  assert.equal(canonicalizeField('firstname'), 'first_name');
  assert.equal(canonicalizeField('given_name'), 'first_name');
  assert.equal(canonicalizeField('surname'), 'last_name');
  assert.equal(canonicalizeField('family_name'), 'last_name');
});

test('dob and address aliases', () => {
  assert.equal(canonicalizeField('date_of_birth'), 'dob');
  assert.equal(canonicalizeField('birthday'), 'dob');
  assert.equal(canonicalizeField('street_address'), 'address');
  assert.equal(canonicalizeField('mailing_address'), 'address');
});

test('substring matching prefers the longest alias', () => {
  assert.equal(canonicalizeField('companyname'), 'company');
});

test('bracket notation is stripped', () => {
  assert.equal(canonicalizeField('name[]'), 'name');
  assert.equal(canonicalizeField('phone[0]'), 'phone');
});

test('unknown or empty input returns null', () => {
  assert.equal(canonicalizeField('random_thing_xyz'), null);
  assert.equal(canonicalizeField(''), null);
  assert.equal(canonicalizeField(null), null);
});

test('labelFor gives a friendly label', () => {
  assert.equal(labelFor('dob'), 'Date of birth');
  assert.equal(labelFor('email'), 'Email');
});

test('profileGroups lists in_profile canonical fields only', () => {
  const groups = profileGroups();
  const flat = groups.flatMap((g) => g.fields.map((f) => f.canonical));
  assert.ok(flat.includes('name'));
  assert.ok(flat.includes('email'));
  assert.ok(flat.includes('postal_code'));
  assert.equal(flat.includes('comments'), false);
});
