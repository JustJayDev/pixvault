#!/usr/bin/env node
// ============================================================
// PixVault smoke test — the shipped artefacts in dist/.
// Zero new dependencies: node:test + node:assert only.
// Run AFTER a build:  npm run build && npm run smoke
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const p = (...s) => path.join(DIST, ...s);
const exists = (f) => fs.existsSync(f) && fs.statSync(f).isFile();

test('dist/ exists', () => {
  assert.ok(fs.existsSync(DIST) && fs.statSync(DIST).isDirectory(),
    'dist/ not found — run `npm run build` first');
});

test('dist/index.html exists and is non-empty', () => {
  assert.ok(exists(p('index.html')), 'dist/index.html is missing');
  const html = fs.readFileSync(p('index.html'), 'utf8');
  assert.ok(html.trim().length > 0, 'dist/index.html is empty');
});

test('index.html has a root mount point', () => {
  const html = fs.readFileSync(p('index.html'), 'utf8');
  assert.match(html, /id=["']root["']/, 'no id="root" mount point in index.html');
});

test('index.html has a real <title>', () => {
  const html = fs.readFileSync(p('index.html'), 'utf8');
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  assert.ok(m, 'index.html has no <title>');
  const t = m[1].trim();
  assert.ok(t.length > 0, '<title> is empty');
  assert.ok(
    !/^(lorem|placeholder|todo|untitled|test|app)$/i.test(t),
    '<title> looks like a placeholder: ' + JSON.stringify(t)
  );
});

test('index.html references the built JS bundle', () => {
  const html = fs.readFileSync(p('index.html'), 'utf8');
  assert.match(html, /<script[^>]+src=["'][^"']*\/assets\/[^"']+\.js["']/,
    'index.html does not reference an /assets/*.js script');
});

test('dist/manifest.webmanifest is valid JSON with required fields', () => {
  assert.ok(exists(p('manifest.webmanifest')), 'dist/manifest.webmanifest is missing');
  let m;
  const raw = fs.readFileSync(p('manifest.webmanifest'), 'utf8');
  try { m = JSON.parse(raw); } catch (e) { assert.fail('manifest is invalid JSON: ' + e.message); }
  for (const k of ['name', 'short_name', 'start_url', 'display', 'icons']) {
    assert.ok(m[k] !== undefined, 'manifest missing field ' + JSON.stringify(k));
  }
});

test('every manifest icon exists in dist', () => {
  const m = JSON.parse(fs.readFileSync(p('manifest.webmanifest'), 'utf8'));
  assert.ok(Array.isArray(m.icons) && m.icons.length > 0, 'manifest has no icons');
  for (const ic of m.icons) {
    assert.ok(ic && ic.src, 'icon entry without src');
    assert.ok(exists(p(ic.src.replace(/^[.\/]+/, ''))), 'icon not shipped: ' + ic.src);
  }
});

test('dist/sw.js exists and parses', () => {
  assert.ok(exists(p('sw.js')), 'dist/sw.js is missing');
  const src = fs.readFileSync(p('sw.js'), 'utf8');
  // The service worker is emitted as a classic script; compile it as one
  // rather than pattern-matching brackets.
  assert.doesNotThrow(() => {
    new vm.Script(src, { filename: 'dist/sw.js' });
  });
});

test('at least one asset exists under dist/assets/', () => {
  const dir = p('assets');
  assert.ok(exists(dir + path.sep) || fs.existsSync(dir), 'dist/assets/ is missing');
  const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
  assert.ok(files.length > 0, 'dist/assets/ is empty');
  assert.ok(files.some((f) => f.endsWith('.js')), 'no JS bundle in dist/assets/');
  assert.ok(files.some((f) => f.endsWith('.css')), 'no CSS bundle in dist/assets/');
});