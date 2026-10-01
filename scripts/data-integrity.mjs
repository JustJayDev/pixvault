// ============================================================
// PixVault — wallpaper data integrity (used by check-build.mjs)
// ------------------------------------------------------------
// Schema was read from the live src/data/wallpapers.json:
//   id, title, file, thumb, width, height, size, category,
//   device, tags, colors, source, featured, added
// A malformed entry must fail the BUILD, not the page.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src', 'data', 'wallpapers.json');
const WALLDIR = path.join(ROOT, 'public', 'wallpapers');

const REQUIRED = ['id', 'title', 'file', 'category', 'device'];
const DEVICES = ['phone', 'desktop'];

/* Category names defined by promptEngine's CATEGORY_CATALOG.
   Only the wallpaper-shaped (lowercase) entries are categories;
   the camelCase names above it are template labels. */
export function catalogCategories() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'promptEngine.js'), 'utf8');
  const at = src.indexOf('CATEGORY_CATALOG');
  if (at === -1) return [];
  const block = src.slice(at);
  return [...block.matchAll(/^ {4}name: '([^']+)'/gm)].map((m) => m[1]);
}
export function checkDataIntegrity(fail, notes) {
  if (!fs.existsSync(DATA)) return;
  let data;
  try { data = JSON.parse(fs.readFileSync(DATA, 'utf8')); }
  catch { return; } // parse error already reported by check-build
  if (!Array.isArray(data)) return;
  const before = fail.length;

  const known = catalogCategories();
  const seen = new Map();

  data.forEach((w, i) => {
    const where = 'entry #' + i + (w && w.id ? ' ("' + w.id + '")' : '');
    if (!w || typeof w !== 'object' || Array.isArray(w)) {
      fail('wallpapers.json: ' + where + ' is not an object');
      return;
    }
    for (const k of REQUIRED) {
      if (w[k] === undefined || w[k] === '') {
        fail('wallpapers.json: ' + where + ' missing required field "' + k + '"');
      }
    }
    if (typeof w.id === 'string' || typeof w.id === 'number') {
      const key = String(w.id);
      if (seen.has(key)) {
        fail('wallpapers.json: duplicate id "' + key + '" (entries #' +
          seen.get(key) + ' and #' + i + ')');
      } else seen.set(key, i);
    }
    if (w.device && DEVICES.indexOf(w.device) === -1) {
      fail('wallpapers.json: ' + where + ' unknown device "' + w.device +
        '" (expected ' + DEVICES.join(' or ') + ')');
    }
    if (w.category && known.length && known.indexOf(w.category) === -1) {
      fail('wallpapers.json: ' + where + ' category "' + w.category +
        '" is not in promptEngine CATEGORY_CATALOG');
    }
    if (typeof w.file === 'string' && w.file) {
      const p = path.join(WALLDIR, w.file);
      if (!fs.existsSync(p)) {
        fail('wallpapers.json: ' + where + ' file not found - public/wallpapers/' + w.file);
      } else if (fs.statSync(p).size === 0) {
        fail('wallpapers.json: ' + where + ' file is empty - public/wallpapers/' + w.file);
      }
    }
    if (typeof w.thumb === 'string' && w.thumb) {
      const p = path.join(WALLDIR, w.thumb);
      if (!fs.existsSync(p)) {
        fail('wallpapers.json: ' + where + ' thumb not found - public/wallpapers/' + w.thumb);
      }
    }
    if (w.width !== undefined && typeof w.width !== 'number') {
      fail('wallpapers.json: ' + where + ' width must be a number');
    }
    if (w.height !== undefined && typeof w.height !== 'number') {
      fail('wallpapers.json: ' + where + ' height must be a number');
    }
    if (w.tags !== undefined && !Array.isArray(w.tags)) {
      fail('wallpapers.json: ' + where + ' tags must be an array');
    }
    if (w.colors !== undefined && !Array.isArray(w.colors)) {
      fail('wallpapers.json: ' + where + ' colors must be an array');
    }
  });

  if (fail.length === before) {
    notes.push('data integrity: ' + data.length +
      ' wallpaper entries validated (unique ids, files+thumbs on disk, categories in catalog)');
  }
}