// ============================================================
// PixVault — Prompt history store
// Pending prompts → image attached → approved → published.
// Lives in localStorage; approved items are published to GitHub.
// ============================================================
const KEY = 'pixvault:prompt-history';

const seed = () => [];

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : seed();
  } catch { return seed(); }
}

function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* */ }
}

/* add a freshly generated prompt as pending */
export function addPrompt({ prompt, category, device, mode, hint }) {
  const list = getHistory();
  const item = {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    prompt,
    category,
    device,
    mode,
    hint: hint || '',
    status: 'pending', // pending → ready → approved → published
    title: '',
    fileName: '',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    publishedAt: null,
  };
  list.unshift(item);
  save(list);
  return item;
}

export function updatePrompt(id, patch) {
  const list = getHistory();
  const next = list.map((p) => (p.id === id ? { ...p, ...patch } : p));
  save(next);
  return next.find((p) => p.id === id);
}

export function removePrompt(id) {
  const list = getHistory().filter((p) => p.id !== id);
  save(list);
}

export function clearPublished() {
  save(getHistory().filter((p) => p.status !== 'published'));
}

export const STATUS = {
  PENDING: 'pending',     // prompt created, no image yet
  READY: 'ready',         // image attached, awaiting approval
  APPROVED: 'approved',   // approved, publishing
  PUBLISHED: 'published', // live on the site
};