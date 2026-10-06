// Packaging check: every file the browser needs is present and referenced
// correctly (the main static reason an unpacked extension fails to load).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const exists = (rel) => existsSync(join(root, rel));

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));

test('manifest is MV3 and declares the expected entry points', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '1.0.0');
  assert.equal(manifest.action.default_popup, 'popup.html');
  assert.equal(manifest.background.service_worker, 'background.js');
});

test('referenced entry files exist', () => {
  assert.ok(exists(manifest.action.default_popup));
  assert.ok(exists(manifest.background.service_worker));
});

test('all declared icons exist', () => {
  for (const size of Object.keys(manifest.icons || {})) {
    assert.ok(exists(manifest.icons[size]), `missing icon ${manifest.icons[size]}`);
  }
  for (const size of Object.keys(manifest.action.default_icon || {})) {
    assert.ok(exists(manifest.action.default_icon[size]));
  }
});

test('popup.html links an existing stylesheet and script', () => {
  const html = readFileSync(join(root, 'popup.html'), 'utf8');
  const css = html.match(/href="([^"]+\.css)"/);
  const js = html.match(/src="([^"]+\.js)"/);
  assert.ok(css && exists(css[1]), 'popup stylesheet missing');
  assert.ok(js && exists(js[1]), 'popup script missing');
});

test('every local ES import resolves to an existing file', () => {
  const dirs = [root, join(root, 'lib')];
  const importRe = /from\s+['"](\.\.?\/[^'"]+\.js)['"]/g;
  const seen = [];

  for (const dir of dirs) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.js')) continue;
      const full = join(dir, name);
      const text = readFileSync(full, 'utf8');
      let match;
      while ((match = importRe.exec(text)) !== null) {
        seen.push(match[1]);
        const target = join(dir, match[1]);
        assert.ok(existsSync(target), `${name} imports missing ${match[1]}`);
      }
    }
  }
  assert.ok(seen.length > 0, 'expected at least one local import');
});