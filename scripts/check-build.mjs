#!/usr/bin/env node
// PixVault build gate. Zero external deps. Runs BEFORE `vite build`.
// Checks: 1) every text file under src/ and public/ parses
//         2) public/manifest.webmanifest is valid JSON with required fields
//         3) src/data/wallpapers.json is valid JSON and non-empty
//         4) no secret-shaped strings in src/ or public/
// Exit 0 on success, 1 with a clear message on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);
const rel = (p) => path.relative(ROOT, p);

const TEXT_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const SKIP_DIR = new Set(['node_modules', '.git', 'dist', '.vite']);

function walk(dir, out) {
  if (!out) out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile()) out.push(full);
  }
  return out;
}

const allFiles = walk(path.join(ROOT, 'src')).concat(walk(path.join(ROOT, 'public')));

// esbuild is already installed via Vite; find it (pnpm keeps it in .pnpm)
async function loadEsbuild() {
  const require = createRequire(import.meta.url);
  const cands = ['esbuild'];
  const store = path.join(ROOT, 'node_modules', '.pnpm');
  if (fs.existsSync(store)) {
    for (const n of fs.readdirSync(store)) {
      if (n.startsWith('esbuild@')) cands.push(path.join(store, n, 'node_modules', 'esbuild'));
    }
  }
  for (const c of cands) {
    try { return await import(pathToFileURL(require.resolve(c)).href); } catch { /* next */ }
  }
  return null;
}

// String/comment-aware balance check. Skips line comments, block comments,
// quoted strings (with escapes) and template literals, so braces inside
// strings are never counted. NOT naive paren-counting.
function balanceCheck(code) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  let i = 0, line = 1;
  const n = code.length;
  while (i < n) {
    const c = code[i], c2 = code[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && c2 === '/') { while (i < n && code[i] !== '\n') i++; continue; }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) { if (code[i] === '\n') line++; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < n) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === '\n') return 'unterminated string near line ' + line;
        if (code[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '`') {
      i++; let d = 0;
      while (i < n) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === '\n') line++;
        if (d === 0 && code[i] === '`') { i++; break; }
        if (code[i] === '$' && code[i + 1] === '{') { d++; i += 2; continue; }
        if (d > 0) { if (code[i] === '{') d++; else if (code[i] === '}') d--; }
        i++;
      }
      continue;
    }
    if (c === '(' || c === '[' || c === '{') { stack.push([c, line]); i++; continue; }
    if (c === ')' || c === ']' || c === '}') {
      const open = stack.pop();
      if (!open) return 'unbalanced ' + JSON.stringify(c) + ' at line ' + line + ' with nothing open';
      if (open[0] !== pairs[c]) return 'unbalanced ' + JSON.stringify(c) + ' at line ' + line + ' (opened ' + open[0] + ' at line ' + open[1] + ')';
      i++; continue;
    }
    i++;
  }
  if (stack.length) {
    const s = stack[stack.length - 1];
    return 'unclosed ' + s[0] + ' opened at line ' + s[1];
  }
  return null;
}

const esbuild = await loadEsbuild();
notes.push(esbuild ? 'parser: esbuild ' + esbuild.version : 'parser: builtin balance check (esbuild not resolvable)');

const sourceFiles = allFiles.filter((f) => TEXT_EXT.has(path.extname(f)));
for (const f of sourceFiles) {
  const code = fs.readFileSync(f, 'utf8');
  if (esbuild) {
    const ext = path.extname(f).slice(1);
    const loader = ext === 'ts' ? 'ts' : ext === 'tsx' ? 'tsx' : ext === 'jsx' ? 'jsx' : 'js';
    try { await esbuild.transform(code, { loader, sourcefile: f }); }
    catch (e) { fail(rel(f) + ': parse error - ' + String((e.errors && e.errors[0] && e.errors[0].text) || e.message).split('\n')[0]); }
  } else {
    const why = balanceCheck(code);
    if (why) fail(rel(f) + ': ' + why);
  }
}
notes.push('parsed ' + sourceFiles.length + ' text file(s) under src/ and public/');

const manifestPath = path.join(ROOT, 'public', 'manifest.webmanifest');
if (!fs.existsSync(manifestPath)) {
  fail('public/manifest.webmanifest is missing');
} else {
  let m = null;
  try { m = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch (e) { fail('manifest.webmanifest: invalid JSON - ' + e.message); }
  if (m) {
    for (const k of ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color', 'background_color']) {
      if (m[k] === undefined) fail('manifest.webmanifest: missing required field ' + JSON.stringify(k));
    }
    if (Array.isArray(m.icons)) {
      for (const ic of m.icons) {
        if (!ic || !ic.src) { fail('manifest.webmanifest: icon entry without src'); continue; }
        const p = path.join(ROOT, 'public', ic.src.replace(/^[.\/]+/, ''));
        if (!fs.existsSync(p)) fail('manifest.webmanifest: icon not found on disk - ' + ic.src);
      }
    }
  }
}

const dataPath = path.join(ROOT, 'src', 'data', 'wallpapers.json');
if (!fs.existsSync(dataPath)) {
  fail('src/data/wallpapers.json is missing');
} else {
  const raw = fs.readFileSync(dataPath, 'utf8');
  if (raw.trim().length === 0) {
    fail('src/data/wallpapers.json is empty');
  } else {
    try {
      const data = JSON.parse(raw);
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      if (count === 0) fail('src/data/wallpapers.json parsed but contains no entries');
      else notes.push('wallpapers.json: valid JSON, ' + count + ' entries');
    } catch (e) {
      fail('src/data/wallpapers.json: invalid JSON - ' + e.message);
    }
  }
}

const PATTERNS = [
  ['ghp_', /ghp_[A-Za-z0-9]{20,}/],
  ['github_pat_', /github_pat_[A-Za-z0-9_]{20,}/],
  ['AKIA', /AKIA[0-9A-Z]{16}/],
  ['sk-', /sk-[A-Za-z0-9]{24,}/],
  ['AIza', /AIza[0-9A-Za-z\-_]{30,}/],
  ['Bearer', /Bearer\s+[A-Za-z0-9\-._~+/]{20,}/]
];
const scannable = allFiles.filter((f) => {
  const e = path.extname(f);
  return TEXT_EXT.has(e) || e === '.json' || e === '.css' || e === '.webmanifest';
});
for (const f of scannable) {
  const text = fs.readFileSync(f, 'utf8');
  for (const pair of PATTERNS) {
    const m = text.match(pair[1]);
    if (m) fail('possible secret (' + pair[0] + ') in ' + rel(f) + ': ' + String(m[0]).slice(0, 12));
  }
}
notes.push('scanned ' + scannable.length + ' file(s) for secret-shaped strings');

for (const n of notes) console.log('  - ' + n);
if (failures.length) {
  console.error('\nBUILD GATE FAILED\n');
  for (const f of failures) console.error('  x ' + f);
  console.error('');
  process.exit(1);
}
console.log('\nBUILD GATE OK\n');
process.exit(0);