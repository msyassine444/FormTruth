import test from 'node:test';
import assert from 'node:assert/strict';

import { identifyField, identifyFieldDetailed, canonicalizeAutocomplete } from '../lib/identify.js';

test('input type shortcuts', () => {
  assert.equal(identifyField({ type: 'email' }), 'email');
  assert.equal(identifyField({ type: 'tel' }), 'phone');
  assert.equal(identifyField({ type: 'url' }), 'website');
});

test('autocomplete tokens map to canonical fields', () => {
  assert.equal(canonicalizeAutocomplete('given-name'), 'first_name');
  assert.equal(canonicalizeAutocomplete('family-name'), 'last_name');
  assert.equal(canonicalizeAutocomplete('street-address'), 'address');
  assert.equal(canonicalizeAutocomplete('postal-code'), 'postal_code');
  assert.equal(canonicalizeAutocomplete('country'), 'country');
  assert.equal(canonicalizeAutocomplete('tel-national'), 'phone');
  assert.equal(canonicalizeAutocomplete('shipping tel'), 'phone');
  assert.equal(canonicalizeAutocomplete('unknown-token'), null);
});

test('falls back to name / id / placeholder / label', () => {
  assert.equal(identifyField({ name: 'custname' }), 'name');
  assert.equal(identifyField({ id: 'custemail' }), 'email');
  assert.equal(identifyField({ placeholder: 'Your phone' }), 'phone');
  assert.equal(identifyField({ label: 'Date of Birth' }), 'dob');
});

test('aria-labelledby beats misleading name and id', () => {
  assert.equal(
    identifyField({
      id: 'random-name',
      name: 'user_name',
      ariaLabelledby: 'Email address',
    }),
    'email'
  );
  assert.equal(
    identifyField({
      name: 'phone',
      'aria-labelledby': 'Date of Birth',
    }),
    'dob'
  );
});

test('aria-labelledby beats aria-label (accessible name rule)', () => {
  assert.equal(
    identifyField({
      ariaLabelledby: 'Phone',
      ariaLabel: 'Email address',
    }),
    'phone'
  );
});

test('arabic labels and names identify canonical fields', () => {
  assert.equal(identifyField({ label: 'البريد الإلكتروني' }), 'email');
  assert.equal(identifyField({ placeholder: 'الهاتف' }), 'phone');
  assert.equal(identifyField({ label: 'الاسم الأول' }), 'first_name');
  assert.equal(identifyField({ label: 'اسم العائلة' }), 'last_name');
  assert.equal(identifyField({ label: 'تاريخ الميلاد' }), 'dob');
  assert.equal(identifyField({ label: 'الرمز البريدي' }), 'postal_code');
  assert.equal(identifyField({ label: 'الشركة' }), 'company');
});

test('french labels identify canonical fields', () => {
  assert.equal(identifyField({ label: 'Prénom' }), 'first_name');
  assert.equal(identifyField({ label: 'Téléphone' }), 'phone');
  assert.equal(identifyField({ label: 'Ville' }), 'city');
  assert.equal(identifyField({ label: 'Pays' }), 'country');
  assert.equal(identifyField({ label: 'Code postal' }), 'postal_code');
  assert.equal(identifyField({ label: 'Date de naissance' }), 'dob');
  assert.equal(identifyField({ label: 'Entreprise' }), 'company');
});

test('username is NOT a person name (false-positive guard)', () => {
  assert.equal(identifyField({ name: 'username' }), null);
  assert.equal(identifyField({ id: 'user_login' }), null);
  assert.equal(identifyField({ placeholder: 'Enter username' }), null);
});

test('confidence model reflects signal strength', () => {
  assert.equal(identifyFieldDetailed({ type: 'email' }).confidence, 0.99);
  assert.equal(identifyFieldDetailed({ autocomplete: 'bday' }).confidence, 0.95);
  assert.equal(identifyFieldDetailed({ ariaLabelledby: 'Email' }).confidence, 0.95);
  assert.equal(identifyFieldDetailed({ label: 'Email' }).confidence, 0.9);
  assert.equal(identifyFieldDetailed({ 'data-testid': 'phone' }).confidence, 0.85);
  assert.equal(identifyFieldDetailed({ placeholder: 'Your phone' }).confidence, 0.6);
  assert.equal(identifyFieldDetailed({ name: 'custname' }).confidence, 0.5);
  assert.equal(identifyFieldDetailed({ name: 'totally_unrelated' }).confidence, 0);
});

test('unrelated fields are ignored', () => {
  assert.equal(identifyField({ name: 'totally_unrelated' }), null);
  assert.equal(identifyField(null), null);
});
