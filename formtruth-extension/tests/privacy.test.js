// Privacy regression: the extension must never transmit form values and must
// not request broad host permissions.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function jsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== 'tests' && name !== 'icons') out.push(...jsFiles(full));
    } else if (name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const sources = jsFiles(root).map((file) => ({
  file,
  text: readFileSync(file, 'utf8'),
}));

const FORBIDDEN = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource'];

test('no networking APIs anywhere in the extension source', () => {
  for (const { file, text } of sources) {
    for (const needle of FORBIDDEN) {
      assert.equal(
        text.includes(needle),
        false,
        `${file} must not use ${needle}`,
      );
    }
  }
});

test('no console logging of values', () => {
  for (const { file, text } of sources) {
    assert.equal(/console\.(log|info|warn|error|debug)/.test(text), false, file);
  }
});

test('manifest requests no host permissions and no downloads', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  assert.equal('host_permissions' in manifest, false);
  assert.equal('web_accessible_resources' in manifest, false);
  const permissions = manifest.permissions || [];
  assert.deepEqual(permissions.slice().sort(), ['activeTab', 'scripting', 'storage']);
  assert.equal(permissions.includes('downloads'), false);
});