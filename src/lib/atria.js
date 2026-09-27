// ============================================================
// PixVault — Atria prompt client (VAULT-MIGRATED)
// ------------------------------------------------------------
// Atria reads the live vault and writes a refined, never-used,
// anti-AI-looking prompt. Text model only (no image gen).
//
// MIGRATION NOTE: This file previously bundled two Atria API keys
// (BUILT_IN_KEYS) and rotated them in the browser. It no longer
// holds ANY key. Requests now go through the DevVault, which keeps
// the keys server-side and rotates them there. The browser sends
// only the prompt text.
// ============================================================
import { wallpapers } from './wallpapers';
import { getCategoryCounts, getAllTags } from './wallpapers';
import { getVault } from './vault-instance';

const MODEL = 'Atria-Dawn-Preview';

/* The system prompt that makes Atria a wallpaper-prompt specialist.
   Unchanged from the previous implementation. */
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

/* The number of Atria keys is now reported by the Vault, not counted
   in the browser. Returns 0 when not connected. */
export function getKeyCount() {
  try { return getVault().isAuthenticated() ? 1 : 0; } catch { return 0; }
}
/* Kept for the Settings UI so nothing breaks, but it no longer reads
   or writes any key material — there is nothing client-side to store. */
export function getExtraKeys() { return []; }
export function setExtraKeys() { /* no-op: keys live in the Vault now */ }

/* Call Atria through the Vault. Keys rotate server-side. */
export async function generatePrompt({ category, device = 'phone', mode = 'curated', hint = '' }) {
  const vault = getVault();
  if (!vault.isAuthenticated()) throw new Error('Not authorized with the Vault. Open Settings → Connect Vault.');
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
  const text = await vault.chat(payload.messages, MODEL);
  return String(text || '').trim();
}