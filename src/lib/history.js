// ============================================================
// PixVault — Prompt history store
// Pending prompts → image attached → approved → published.
//
// IN-MEMORY ONLY. Nothing here is written to localStorage,
// sessionStorage, cookies or IndexedDB — same discipline as
// vault.js. The `prompt` and `hint` fields are free-text admin
// input, so persisting them to disk would risk a pasted
// credential outliving the session with no cap and no expiry.
//
// CONSEQUENCE, DELIBERATE: history is lost on page refresh.
// Publish is a GitHub commit, not local state, so nothing
// that matters lives here. Never re-add a storage API call.
// ============================================================

/* hard cap — oldest entries are evicted first */
const MAX_ENTRIES = 50;

/* module-level array; lives exactly as long as the JS context */
let store = [];

function commit(list) {
  /* newest first, so keeping the head keeps the newest and
     evicts the oldest */
  store = list.slice(0, MAX_ENTRIES);
  return store;
}

/* returns a shallow copy so callers cannot mutate the store */
export function getHistory() {
  return store.map((p) => ({ ...p }));
}

/* add a freshly generated prompt as pending */
export function addPrompt({ prompt, category, device, mode, hint }) {
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
  commit([item, ...store]);
  return item;
}

export function updatePrompt(id, patch) {
  const next = store.map((p) => (p.id === id ? { ...p, ...patch } : p));
  commit(next);
  return next.find((p) => p.id === id);
}

export function removePrompt(id) {
  commit(store.filter((p) => p.id !== id));
}

export function clearPublished() {
  commit(store.filter((p) => p.status !== 'published'));
}

/* drop everything — there is nothing on disk to clean up */
export function clearAll() {
  store = [];
}

/* entries currently held; tests assert the cap against this */
export function size() {
  return store.length;
}

/* the cap itself, so tests need not hardcode 50 */
export const MAX = MAX_ENTRIES;

export const STATUS = {
  PENDING: 'pending',     // prompt created, no image yet
  READY: 'ready',         // image attached, awaiting approval
  APPROVED: 'approved',   // approved, publishing
  PUBLISHED: 'published', // live on the site
};