// ============================================================
// PixVault v2 — data helpers: filtering, sorting, favorites,
// dominant-color extraction and download.
// ============================================================
import data from '../data/wallpapers.json';

export const wallpapers = data;

export const getCategoryCounts = () => {
  const counts = {};
  wallpapers.forEach((w) => {
    counts[w.category] = (counts[w.category] || 0) + 1;
  });
  return counts;
};

export const getCategories = () => {
  const counts = getCategoryCounts();
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .map((name) => ({ name, count: counts[name] }));
};

export const getAllTags = () => {
  const set = new Set();
  wallpapers.forEach((w) => w.tags?.forEach((t) => set.add(t)));
  return Array.from(set).sort();
};

/* --- filtering --- */
export function filterWallpapers({
  q = '',
  category = 'all',
  device = 'all',
  color = 'all',
  sort = 'latest',
  favoritesOnly = false,
  favs = [],
} = {}) {
  const term = q.trim().toLowerCase();
  let list = wallpapers.filter((w) => {
    if (favoritesOnly && !favs.includes(w.id)) return false;
    if (category !== 'all' && w.category !== category) return false;
    if (device !== 'all' && w.device !== device) return false;
    if (color !== 'all' && !(w.colors || []).includes(color)) return false;
    if (term) {
      const hay = [w.title, w.category, w.device, ...(w.tags || [])].join(' ').toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  switch (sort) {
    case 'latest':
      list.sort((a, b) => (b.added || '').localeCompare(a.added || ''));
      break;
    case 'oldest':
      list.sort((a, b) => (a.added || '').localeCompare(b.added || ''));
      break;
    case 'featured':
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
    case 'shuffle':
      list = [...list];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      break;
    default:
      break;
  }
  return list;
}

/* --- related by shared tags --- */
export function getRelated(wp, limit = 6) {
  if (!wp) return [];
  const tags = new Set(wp.tags || []);
  return wallpapers
    .filter((w) => w.id !== wp.id)
    .map((w) => ({
      w,
      score: (w.tags || []).reduce((s, t) => s + (tags.has(t) ? 1 : 0), 0) + (w.category === wp.category ? 0.5 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.w);
}

/* --- favorites (localStorage, no account) --- */
const FAV_KEY = 'pixvault:favs';
export function getFavs() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  } catch {
    return [];
  }
}
export function toggleFav(id) {
  const favs = getFavs();
  const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}

/* --- paths --- */
const BASE = import.meta.env.BASE_URL || '/pixvault/';
export const thumbUrl = (wp) => `${BASE}wallpapers/${wp.thumb}`;
export const fullUrl = (wp) => `${BASE}wallpapers/${wp.file}`;
export const aspectRatio = (wp) => (wp.width && wp.height ? wp.width / wp.height : 9 / 16);
export const resolutionLabel = (wp) =>
  wp.width && wp.height ? `${wp.width}×${wp.height}` : 'Original';

/* --- download the untouched original --- */
export async function downloadOriginal(wp) {
  const url = fullUrl(wp);
  /* keep the original file's extension so the saved name matches the bytes */
  const ext = (wp.file || '').split('.').pop() || 'jpg';
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${wp.id}-${wp.width}x${wp.height}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch {
    window.open(url, '_blank');
  }
}

/* --- dominant color for ambient glow (canvas extraction) --- */
const colorCache = new Map();
export function getDominantColor(url) {
  if (colorCache.has(url)) return Promise.resolve(colorCache.get(url));
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 200) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        if (!n) return resolve(null);
        const hex = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
        colorCache.set(url, hex);
        resolve(hex);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}
