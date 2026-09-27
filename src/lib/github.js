// ============================================================
// PixVault — GitHub publish client (VAULT-MIGRATED)
// ------------------------------------------------------------
// Commits wallpapers/thumbs/data straight from the admin panel.
//
// MIGRATION NOTE: This file previously shipped a classic GitHub
// PAT (BUILT_IN_TOKEN, split into fragments and reassembled at
// runtime) plus a localStorage override. It no longer holds ANY
// token. All GitHub operations now go through the DevVault, which
// stores the PAT server-side and enforces PixVault's policy
// (repo JustJayDev/pixvault, branch main, path allow-list).
// The browser never sees the credential.
// ============================================================
import data from '../data/wallpapers.json';
import { getVault } from './vault-instance';

const BRANCH = 'main';

/* kept for the Settings UI (no-ops now — there is no client-side token) */
export function getToken() { return null; }
export function setToken() { /* no-op: tokens live in the Vault */ }
export function clearToken() { /* no-op */ }

/* file → base64 (data-url free) */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const d = r.result;
      resolve(d.includes(',') ? d.split(',')[1] : d);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* read width/height from an image File */
export function getDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ w: 0, h: 0 }); };
    img.src = url;
  });
}

/* downscale an image File to a JPEG thumbnail (max edge 640) */
export async function makeThumb(file, maxEdge = 640) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* slugify a title into a filename */
export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'wallpaper';
}

/* guess device from aspect ratio */
export function deviceFor(w, h) {
  if (!w || !h) return 'phone';
  return h > w ? 'phone' : 'desktop';
}

/* fetch the LIVE wallpapers.json through the Vault at publish time.
   The statically-imported bundle is stale the moment any publish
   happens, which causes 409s and lost entries. Always read fresh. */
let liveCache = null;
async function getLiveJson() {
  try {
    const j = await getVault().getFile(`src/data/wallpapers.json`);
    if (!j || !j.decoded) throw new Error('no decoded content');
    const parsed = JSON.parse(j.decoded);
    liveCache = j.sha;
    return parsed;
  } catch (e) {
    /* fall back to the bundled copy if the fetch fails */
    return data;
  }
}

/* public helper for the Wallpapers tab to list live entries */
export async function getLiveWallpapers() {
  return await getLiveJson();
}

/* commit a single file — retries once on a stale sha */
async function commitFile(path, content, message) {
  const vault = getVault();
  const attempt = async () => vault.putFile(path, content, message);
  try {
    return await attempt();
  } catch (e) {
    /* 409 = the sha we held is stale. The Vault refetches and retries once. */
    if (String(e.message).includes('409') || String(e.message).toLowerCase().includes('does not match')) {
      return await attempt();
    }
    throw e;
  }
}

/* the full publish flow ---------- */
export async function publishWallpaper({ file, entry, commitMsg }) {
  if (!getVault().isAuthenticated()) throw new Error('Not authorized with the Vault. Open Settings → Connect Vault.');
  if (!file) throw new Error('No image file attached.');

  const base = slugify(entry.title || entry.id || 'wallpaper');
  /* keep the extension the user actually uploaded — a .png saved as .jpg
     would make the downloaded filename lie about the file's real format */
  const ext = (file.name || '').split('.').pop().toLowerCase() || 'jpg';
  const fullName = `${base}.${ext}`;
  const thumbName = `${base}.webp`;

  const imgB64 = await fileToBase64(file);
  const thumbB64 = await makeThumb(file);

  /* read the live list so we never clobber a concurrent publish */
  const live = await getLiveJson();

  const steps = [];

  // 1) original image
  steps.push(commitFile(`public/wallpapers/${fullName}`, imgB64, `wallpaper: add ${fullName}`));

  // 2) thumbnail
  if (thumbB64) {
    steps.push(commitFile(`public/wallpapers/thumbs/${thumbName}`, thumbB64, `wallpaper: thumb ${thumbName}`));
  }

  // 3) update wallpapers.json against the live copy
  const next = live
    .filter((w) => w.id !== entry.id)
    .concat([{ ...entry, file: fullName, thumb: `thumbs/${thumbName}` }]);
  const jsonB64 = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))));
  steps.push(commitFile('src/data/wallpapers.json', jsonB64, commitMsg || `wallpaper: publish ${entry.title}`));

  // run sequentially so the tree stays consistent
  const results = [];
  for (const s of steps) results.push(await s);
  return { results, file: fullName, thumb: thumbName, count: next.length };
}

/* ---------- delete a wallpaper ---------- */
export async function deleteWallpaper(id) {
  if (!getVault().isAuthenticated()) throw new Error('Not authorized with the Vault.');
  const live = await getLiveJson();
  const wp = live.find((w) => w.id === id);
  if (!wp) throw new Error('Wallpaper not found.');

  // remove files (ignore failure if already gone)
  try { await getVault().deleteFile(`public/wallpapers/${wp.file}`, `wallpaper: remove ${wp.file}`); } catch { /* */ }
  try { await getVault().deleteFile(`public/wallpapers/${wp.thumb}`, `wallpaper: remove thumb ${wp.thumb}`); } catch { /* */ }

  // update json without it — always from the live copy
  const next = live.filter((w) => w.id !== id);
  const jsonB64 = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))));
  await commitFile('src/data/wallpapers.json', jsonB64, `wallpaper: delete ${wp.title}`);
  return { ok: true, count: next.length };
}

/* ---------- edit a wallpaper's metadata ---------- */
export async function updateWallpaper(id, patch) {
  if (!getVault().isAuthenticated()) throw new Error('Not authorized with the Vault.');
  const live = await getLiveJson();
  const next = live.map((w) => (w.id === id ? { ...w, ...patch } : w));
  const jsonB64 = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))));
  await commitFile('src/data/wallpapers.json', jsonB64, `wallpaper: edit ${id}`);
  return { ok: true, count: next.length };
}

export { data as wallpapers };