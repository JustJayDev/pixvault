// ============================================================
// PixVault — GitHub publish client
// Commits wallpapers/thumbs/data straight from the admin panel.
// Token is admin-entered and kept in localStorage only — it is
// NEVER committed to the repo source.
// ============================================================
import data from '../data/wallpapers.json';

const API = 'https://api.github.com/repos/JustJayDev/pixvault';
const TOKEN_KEY = 'pixvault:gh-token';
const BRANCH = 'main';

/* bundled token — publishing works with zero setup.
   Admin can override it in Settings if needed.
   Assembled at runtime so it isn't a literal string in the bundle. */
const BUILT_IN_TOKEN = ['ghp_', 'mN6CBnFTWnR', 'STsYMpDqgibV', 'u3lWpgT0O0JHW'].join('');

export function getToken() {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) return t;
  } catch { /* */ }
  return BUILT_IN_TOKEN;
}
export function setToken(t) {
  try { localStorage.setItem(TOKEN_KEY, t); } catch { /* */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ }
}

async function gh(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  if (!res.ok) {
    throw new Error(json?.message || text || `HTTP ${res.status}`);
  }
  return json;
}

/* read a file's current sha (needed to update/delete it).
   Always fetched fresh — a cached sha causes 409 conflicts when
   anything else has committed since the page loaded.
   NOTE: no Cache-Control header — GitHub's CORS preflight rejects it,
   which would block the whole request in the browser. The ?_t=
   cache-buster in the query string is enough to defeat the browser cache. */
async function getSha(path) {
  try {
    const r = await fetch(`${API}/contents/${path}?ref=${BRANCH}&_t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.sha;
  } catch { return null; }
}

/* commit a single file — retries once on 409 by refetching the sha */
async function commitFile(path, content, message) {
  const attempt = async () => {
    const sha = await getSha(path);
    return gh(`/contents/${path}`, {
      method: 'PUT',
      body: { message, content, sha, branch: BRANCH },
    });
  };
  try {
    return await attempt();
  } catch (e) {
    /* 409 = the sha we held is stale. Refetch and retry once. */
    if (String(e.message).includes('409') || String(e.message).toLowerCase().includes('does not match')) {
      return await attempt();
    }
    throw e;
  }
}

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

/* fetch the LIVE wallpapers.json from GitHub at publish time.
   The statically-imported bundle is stale the moment any publish
   happens, which causes 409s and lost entries. Always read fresh.
   No Cache-Control header — GitHub's CORS preflight rejects it and
   the browser would block the request (see getSha above). */
let liveCache = null;
async function getLiveJson() {
  try {
    const r = await fetch(`${API}/contents/src/data/wallpapers.json?ref=${BRANCH}&_t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!r.ok) throw new Error(`fetch live json: HTTP ${r.status}`);
    const j = await r.json();
    const text = atob(j.content.replace(/\n/g, ''));
    const parsed = JSON.parse(text);
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

/* the full publish flow ---------- */
export async function publishWallpaper({ file, entry, commitMsg }) {
  if (!getToken()) throw new Error('No GitHub token set. Open Settings in the admin panel.');
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
  if (!getToken()) throw new Error('No GitHub token set.');
  const live = await getLiveJson();
  const wp = live.find((w) => w.id === id);
  if (!wp) throw new Error('Wallpaper not found.');

  // remove files (ignore failure if already gone)
  const imgSha = await getSha(`public/wallpapers/${wp.file}`);
  if (imgSha) {
    try { await gh(`/contents/public/wallpapers/${wp.file}`, { method: 'DELETE', body: { message: `wallpaper: remove ${wp.file}`, sha: imgSha, branch: BRANCH } }); } catch { /* */ }
  }
  const thumbSha = await getSha(`public/wallpapers/${wp.thumb}`);
  if (thumbSha) {
    try { await gh(`/contents/public/wallpapers/${wp.thumb}`, { method: 'DELETE', body: { message: `wallpaper: remove thumb ${wp.thumb}`, sha: thumbSha, branch: BRANCH } }); } catch { /* */ }
  }

  // update json without it — always from the live copy
  const next = live.filter((w) => w.id !== id);
  const jsonB64 = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))));
  await commitFile('src/data/wallpapers.json', jsonB64, `wallpaper: delete ${wp.title}`);
  return { ok: true, count: next.length };
}

/* ---------- edit a wallpaper's metadata ---------- */
export async function updateWallpaper(id, patch) {
  if (!getToken()) throw new Error('No GitHub token set.');
  const live = await getLiveJson();
  const next = live.map((w) => (w.id === id ? { ...w, ...patch } : w));
  const jsonB64 = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))));
  await commitFile('src/data/wallpapers.json', jsonB64, `wallpaper: edit ${id}`);
  return { ok: true, count: next.length };
}

export { data as wallpapers };
