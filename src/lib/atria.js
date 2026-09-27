// ============================================================
// PixVault — Atria prompt client
// Atria reads the live vault and writes a refined, never-used,
// anti-AI-looking prompt. Text model only (no image gen).
// ============================================================
import { wallpapers } from './wallpapers';
import { getCategoryCounts, getAllTags } from './wallpapers';

const ENDPOINT = 'https://api.atria-asi.ai/v1/chat/completions';
const MODEL = 'Atria-Dawn-Preview';
const KEY_STORE = 'pixvault:atria-keys';

/* keys are entered once by the admin, kept in localStorage */
export function getKeys() {
  try {
    const raw = localStorage.getItem(KEY_STORE);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch { return []; }
}
export function setKeys(keys) {
  try { localStorage.setItem(KEY_STORE, JSON.stringify(keys.filter(Boolean))); } catch { /* */ }
}

let keyIdx = 0;
function nextKey() {
  const keys = getKeys();
  if (!keys.length) throw new Error('No Atria API key set. Add one in Settings.');
  const k = keys[keyIdx % keys.length];
  keyIdx++;
  return k;
}

/* Build the context packet Atria sees about the current vault */
export function vaultContext() {
  const counts = getCategoryCounts();
  const tags = getAllTags();
  const titles = wallpapers.map((w) => w.title);
  const subjects = wallpapers.map((w) => (w.tags || []).slice(0, 3).join(', '));
  return {
    total: wallpapers.length,
    categories: counts,
    devices: {
      phone: wallpapers.filter((w) => w.device === 'phone').length,
      desktop: wallpapers.filter((w) => w.device === 'desktop').length,
    },
    tags,
    titles,
    subjects,
  };
}

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
  const ctx = vaultContext();
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

/* Call Atria and return the refined prompt string */
export async function generatePrompt({ category, device = 'phone', mode = 'curated', hint = '' }) {
  const key = nextKey();
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
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
      }),
    });
  } catch (e) {
    throw new Error(`Network error reaching Atria: ${e.message}`);
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Atria API ${res.status}: ${t.slice(0, 200)}`);
  }

  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Atria returned an empty response.');
  return text.trim();
}