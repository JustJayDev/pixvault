// ============================================================
// PixVault — Atria prompt client
// Atria reads the live vault and writes a refined, never-used,
// anti-AI-looking prompt. Text model only (no image gen).
// Keys are bundled — the admin never has to enter them.
// Requests rotate across keys with automatic failover.
// ============================================================
import { wallpapers } from './wallpapers';
import { getCategoryCounts, getAllTags } from './wallpapers';

const ENDPOINT = 'https://api.atria-asi.ai/v1/chat/completions';
const MODEL = 'Atria-Dawn-Preview';
const KEY_STORE = 'pixvault:atria-keys';

/* bundled keys — always available, no setup required */
const BUILT_IN_KEYS = [
  'atr_sMrzdSm7aB-bnYPXt9Tnb8fQipRqrTIC',
  'atr_LS6PyK3NRJxO7RS8BdCgY5iOE1_wJBvY',
];

/* admin can add extra keys in Settings; they merge with the built-ins */
export function getKeys() {
  let extra = [];
  try {
    const raw = localStorage.getItem(KEY_STORE);
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) extra = arr.filter(Boolean);
  } catch { /* */ }
  return [...BUILT_IN_KEYS, ...extra].filter((v, i, a) => a.indexOf(v) === i);
}
export function getExtraKeys() {
  try {
    const raw = localStorage.getItem(KEY_STORE);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch { return []; }
}
export function getKeyCount() {
  return getKeys().length;
}
export function setExtraKeys(keys) {
  try { localStorage.setItem(KEY_STORE, JSON.stringify(keys.filter(Boolean))); } catch { /* */ }
}

/* round-robin pointer so repeated calls spread across keys */
let keyIdx = 0;

/* The system prompt that makes Atria a wallpaper-prompt specialist */
const SYSTEM = `You are the PixVault prompt engine. You design ONE premium wallpaper generation prompt per request.

Rules — follow exactly:
1. Output ONLY the prompt text. No headings, no explanation, no preamble, no quotes, no markdown.
2. The prompt MUST be new and never-used: it must NOT recombine or repeat the subjects, titles, tag sets, or compositions already in the vault context. Invent a fresh scene.
3. The prompt MUST NOT look AI-generated when rendered. Add anti-AI tells: film grain, imperfect asymmetry, natural off-center framing, realistic lighting falloff, incidental detail, a candid unposed feel, optical quirks like slight chromatic aberration or soft bokeh. Forbid plastic skin, over-smoothing, hyper-saturated rainbow palettes, perfect symmetry, and sterile studio cleanliness.
4. Be highly detailed and concrete: name the subject, the exact light, the time of day, the weather, the mood, the color palette (3-4 hues max), the camera/lens feel, the depth of field, and where the subject sits in the frame.
5. Respect the requested device orientation: phone means 9:16 vertical, desktop means 16:9 horizontal.
6. Keep it to 60-110 words. One paragraph. No line breaks.
7. Never include text, logos, watermarks, or UI in the described image.
8. If mode is "random", ignore the requested category and pick any visually striking subject.`;

function userPacket({ category, device, mode, hint }) {
  const counts = getCategoryCounts();
  const tags = getAllTags();
  const ctx = {
    total: wallpapers.length,
    categories: counts,
    devices: {
      phone: wallpapers.filter((w) => w.device === 'phone').length,
      desktop: wallpapers.filter((w) => w.device === 'desktop').length,
    },
    tags,
    titles: wallpapers.map((w) => w.title),
    subjects: wallpapers.map((w) => (w.tags || []).slice(0, 3).join(', ')),
  };
  return [
    'VAULT CONTEXT (what already exists — do NOT repeat these):',
    JSON.stringify(ctx, null, 1),
    '',
    'REQUEST:',
    `- mode: ${mode}`,
    `- category: ${category || 'any'}`,
    `- device: ${device} (${device === 'desktop' ? '16:9 horizontal' : '9:16 vertical'})`,
    hint ? `- extra direction from admin: ${hint}` : '- extra direction: none',
    '',
    'Write ONE fresh, detailed, anti-AI wallpaper prompt now.',
  ].join('\n');
}

/* one attempt against a single key, with a hard timeout */
function attempt(key, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')); }, timeoutMs);
    fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        clearTimeout(timer);
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);
        let j = null;
        try { j = JSON.parse(text); } catch { throw new Error('bad JSON'); }
        const content = j?.choices?.[0]?.message?.content;
        if (!content || !content.trim()) throw new Error('empty content');
        resolve(content.trim());
      })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

/* Call Atria with rotation + hedged failover.
   The first key is tried immediately; if it doesn't answer within
   HEDGE_MS the next key is launched in parallel and whichever
   answers first wins. Fast, and immune to any single slow/dead key. */
const HEDGE_MS = 5000;

export async function generatePrompt({ category, device = 'phone', mode = 'curated', hint = '' }) {
  const keys = getKeys();
  if (!keys.length) throw new Error('No Atria API key available.');

  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userPacket({ category, device, mode, hint }) },
    ],
    temperature: 0.95,
    max_tokens: 700,
    /* Atria is a reasoning model — without this it returns content: null
       and hides the answer inside reasoning_content. */
    extra_body: { enable_thinking: false },
  };

  const start = keyIdx % keys.length;
  keyIdx++;

  /* ordered list beginning at the rotation pointer */
  const order = keys.map((_, i) => keys[(start + i) % keys.length]);

  return new Promise((resolve, reject) => {
    let settled = false;
    let failures = 0;
    const errors = [];
    const timers = [];

    const launch = (key) => {
      attempt(key, payload, 45000).then(
        (text) => {
          if (settled) return;
          settled = true;
          timers.forEach(clearTimeout);
          resolve(text);
        },
        (e) => {
          if (settled) return;
          errors.push(`${key.slice(0, 10)}… ${e.message}`);
          failures++;
          if (failures >= order.length) {
            settled = true;
            timers.forEach(clearTimeout);
            reject(new Error(`All ${order.length} Atria keys failed. ${errors.join(' | ')}`));
          }
        }
      );
    };

    /* launch the first key now, stagger the rest as a hedge */
    order.forEach((key, i) => {
      if (i === 0) launch(key);
      else timers.push(setTimeout(() => launch(key), HEDGE_MS * i));
    });
  });
}