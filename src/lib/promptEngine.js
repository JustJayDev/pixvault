// ============================================================
// PixVault — Prompt Engine
// Analyzes the current vault, finds what's missing, and builds
// production-ready GPT-Image-2 prompts using templates from the
// awesome-gpt-image-2 style library.
// ============================================================
import { wallpapers, getCategories, getCategoryCounts, getAllTags } from './wallpapers';

/* ------------------------------------------------------------
   Style-library templates (awesome-gpt-image-2)
   Each wallpaper category maps to the strongest template.
------------------------------------------------------------ */
const TEMPLATES = {
  scene: {
    id: 'scene-storytelling',
    name: 'Scene Storytelling',
    guidance:
      'Define who, where, when, conflict, emotion, and camera framing. Use scene details to support narrative rather than decoration.',
    pitfalls:
      'Avoid generic fantasy backgrounds. Keep narrative cues visible in the frame.',
  },
  photo: {
    id: 'realistic-photography',
    name: 'Realistic Photography',
    guidance:
      'Specify camera distance, lens, light source, texture, background, and motion. Use believable imperfections for documentary realism.',
    pitfalls:
      'Avoid over-polished plastic skin unless commercial beauty is required. Add negative constraints for hands, text, and anatomy when needed.',
  },
  illustration: {
    id: 'illustration-art-style',
    name: 'Illustration & Art Style',
    guidance:
      'Define composition, subject, palette, brush material, mood, and rendering depth.',
    pitfalls: 'Avoid style-only prompts without composition. Lock character identity when using references.',
  },
  architecture: {
    id: 'architecture-space',
    name: 'Architecture & Space',
    guidance:
      'Define viewpoint, scale, material, lighting, and spatial function.',
    pitfalls: 'Avoid impossible perspectives unless the output is conceptual.',
  },
  poster: {
    id: 'poster-layout-system',
    name: 'Poster Layout System',
    guidance:
      'Lock subject, headline, layout, palette, and aspect ratio. Make the title hierarchy and primary visual clear.',
    pitfalls: 'Avoid mixed moodboards when asking for one finished poster.',
  },
};

/* ------------------------------------------------------------
   Category catalog — the full range PixVault can serve.
   Each carries its template, trending subjects, and palettes.
   This is the "trending similar" knowledge base.
------------------------------------------------------------ */
export const CATEGORY_CATALOG = [
  {
    name: 'devotional',
    label: 'Devotional',
    template: 'photo',
    trending: [
      'golden-hour temple silhouette with drifting incense smoke',
      'aarti diya lamps floating on a sacred river at dawn',
      'intricate golden mandala glowing on dark velvet',
      'divine light beam through temple pillars, dust motes',
      'festival of lights — marigold garlands and oil lamps',
    ],
    palettes: ['gold and amber on deep charcoal', 'saffron and cream', 'emerald and gold'],
  },
  {
    name: 'sports',
    label: 'Sports',
    template: 'poster',
    trending: [
      'lone athlete silhouette under stadium floodlights, rain',
      'football boots close-up on wet pitch, dramatic shadow',
      'golden trophy rising from stadium confetti',
      'sprint motion blur on a night track, light trails',
      'basketball arc against arena spotlight',
    ],
    palettes: ['green and gold', 'electric blue on black', 'warm stadium amber'],
  },
  {
    name: 'nature',
    label: 'Nature',
    template: 'scene',
    trending: [
      'misty mountain valley at first light, sea of clouds',
      'lonely cabin window glowing in a winter pine forest',
      'bioluminescent tide rolling onto a midnight beach',
      'autumn maple corridor with falling leaves, sun flare',
      'desert dunes under a violet twilight sky',
    ],
    palettes: ['emerald and mist', 'amber and rust', 'deep violet and teal'],
  },
  {
    name: 'space',
    label: 'Space',
    template: 'scene',
    trending: [
      'nebula nursery with newborn stars, deep field',
      'lone astronaut adrift above a ringed planet',
      'galactic core rising over a jagged lunar ridge',
      'aurora borealis seen from orbit, city lights below',
      'wormhole aperture with gravitational lensing',
    ],
    palettes: ['indigo and magenta', 'cyan and black', 'gold and obsidian'],
  },
  {
    name: 'cyberpunk',
    label: 'Cyberpunk',
    template: 'architecture',
    trending: [
      'rain-soaked neon alley with holographic billboards',
      'rooftop above a megacity, neon towers in fog',
      'cybernetic market stall under violet awnings',
      'flying car streaks between brutalist arcology towers',
      'lone figure under a broken neon kanabi sign',
    ],
    palettes: ['magenta and cyan', 'amber and teal', 'toxic green on black'],
  },
  {
    name: 'abstract',
    label: 'Abstract',
    template: 'illustration',
    trending: [
      'liquid gold ribbons on matte black, studio light',
      'iridescent fluid sculpture in zero gravity',
      'layered paper topography with warm gradient',
      'smoke and light interference, prismatic',
      'soft 3D spheres in a warm gradient void',
    ],
    palettes: ['gold and obsidian', 'gradient pastel', 'copper and cream'],
  },
  {
    name: 'minimal',
    label: 'Minimal',
    template: 'illustration',
    trending: [
      'single paper boat on vast still water, horizon',
      'one window of warm light in a dark concrete wall',
      'lone tree silhouette on a dune, negative space',
      'gradient archway with long shadow',
      'floating sphere over a still reflecting pool',
    ],
    palettes: ['monochrome warm', 'beige and black', 'muted terracotta'],
  },
  {
    name: 'anime',
    label: 'Anime',
    template: 'illustration',
    trending: [
      'rooftop sunset with cherry blossoms, two figures',
      'rainy bus stop at night, neon reflections',
      'girl with umbrella under a sky of floating lanterns',
      'empty classroom at golden hour, wind in curtains',
      'train crossing a sea at twilight',
    ],
    palettes: ['sunset orange and blue', 'pastel pink and teal', 'night indigo'],
  },
  {
    name: 'cars',
    label: 'Cars',
    template: 'photo',
    trending: [
      'classic muscle car under a desert sunset, dust trail',
      'neon-lit supercar in a rain-soaked underpass',
      'rally car drifting through forest mist',
      'vintage dashboard at night, warm gauge glow',
      'silhouette of a coupe on a coastal cliff road',
    ],
    palettes: ['sunset amber', 'neon blue and black', 'racing red and gold'],
  },
  {
    name: 'city',
    label: 'City',
    template: 'architecture',
    trending: [
      'aerial of a sleeping city, warm window grid',
      'crosswalk blur in evening rain, bokeh headlights',
      'rooftop garden above a concrete skyline',
      'tram rattling through an old quarter at dusk',
      'skyscraper canyon looking straight up',
    ],
    palettes: ['amber window glow', 'steel blue', 'warm grey and gold'],
  },
  {
    name: 'dark',
    label: 'Dark',
    template: 'photo',
    trending: [
      'black sand beach under a moonless sky',
      'charred forest silhouette against a blood-orange dusk',
      'single match flame in vast darkness',
      'raven on a broken column, fog',
      'obsidian cave with a distant emerald exit',
    ],
    palettes: ['near-black and ember', 'ash and copper', 'shadow and jade'],
  },
  {
    name: 'floral',
    label: 'Floral',
    template: 'illustration',
    trending: [
      'overgrown greenhouse interior, golden light',
      'cherry blossom blizzard over a still pond',
      'single dried rose on cracked plaster, raking light',
      'wildflower meadow at last light, butterflies',
      'botanical specimen flat-lay, vintage plate style',
    ],
    palettes: ['rose and sage', 'blush and gold', 'dried terracotta'],
  },
];

/* ------------------------------------------------------------
   Device → aspect ratio / resolution map
------------------------------------------------------------ */
export const DEVICE_SPECS = {
  phone: { label: 'Phone', ratio: '9:16', width: 940, height: 1672 },
  desktop: { label: 'Desktop', ratio: '16:9', width: 1920, height: 1080 },
};

/* ------------------------------------------------------------
   Vault analysis — what do we have, what's missing
------------------------------------------------------------ */
export function analyzeVault() {
  const counts = getCategoryCounts();
  const total = wallpapers.length;

  const tagFreq = {};
  wallpapers.forEach((w) => (w.tags || []).forEach((t) => { tagFreq[t] = (tagFreq[t] || 0) + 1; }));
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);

  const colorFreq = {};
  wallpapers.forEach((w) => (w.colors || []).forEach((c) => { colorFreq[c] = (colorFreq[c] || 0) + 1; }));
  const topColors = Object.entries(colorFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);

  const deviceSplit = { phone: 0, desktop: 0 };
  wallpapers.forEach((w) => { if (deviceSplit[w.device] !== undefined) deviceSplit[w.device]++; });

  /* gaps: catalog categories that are empty or thin relative to the vault */
  const gaps = CATEGORY_CATALOG
    .map((c) => ({ ...c, count: counts[c.name] || 0 }))
    .sort((a, b) => a.count - b.count)
    .filter((c) => c.count < 2);

  /* the weakest device side, so we suggest the right orientation */
  const weakDevice = deviceSplit.phone <= deviceSplit.desktop ? 'phone' : 'desktop';

  return {
    total,
    counts,
    topTags,
    topColors,
    deviceSplit,
    gaps,
    weakDevice,
    categories: getCategories(),
    allTags: getAllTags(),
  };
}

/* Suggest the next wallpapers to generate: gaps × trending */
export function suggestNext(limit = 6) {
  const a = analyzeVault();
  const picks = [];
  const seen = new Set();

  // 1) fill the emptiest categories first
  for (const g of a.gaps) {
    if (picks.length >= limit) break;
    const subject = g.trending[picks.length % g.trending.length];
    const key = `${g.name}:${subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push({
      category: g.name,
      label: g.label,
      subject,
      device: a.weakDevice,
      template: g.template,
      palette: g.palettes[0],
      reason: `${g.label} only has ${g.count} — filling the gap`,
    });
  }
  // 2) then trending twists on categories that already perform
  if (picks.length < limit) {
    for (const c of CATEGORY_CATALOG) {
      if (picks.length >= limit) break;
      const has = a.counts[c.name] || 0;
      if (!has) continue;
      const subject = c.trending[1] || c.trending[0];
      const key = `${c.name}:${subject}`;
      if (seen.has(key)) continue;
      seen.add(key);
      picks.push({
        category: c.name,
        label: c.label,
        subject,
        device: a.weakDevice,
        template: c.template,
        palette: c.palettes[1] || c.palettes[0],
        reason: `trending twist on ${c.label} (you have ${has})`,
      });
    }
  }
  return picks;
}

/* ------------------------------------------------------------
   Prompt builder — follows the style-library 6-block structure.
   Returns a copyable GPT-Image-2 prompt.
------------------------------------------------------------ */
export function buildPrompt({ category, device = 'phone', subject, palette, template, extra = '' }) {
  const cat = CATEGORY_CATALOG.find((c) => c.name === category) || CATEGORY_CATALOG[0];
  const tpl = TEMPLATES[template || cat.template] || TEMPLATES.scene;
  const spec = DEVICE_SPECS[device] || DEVICE_SPECS.phone;
  const pal = palette || cat.palettes[0];

  const orientation =
    device === 'desktop'
      ? 'horizontal landscape composition suited to a 16:9 desktop screen'
      : 'vertical portrait composition suited to a 9:16 phone screen, subject anchored in the upper-middle so the lock-screen clock area stays clean';

  return [
    `Subject & task: A high-resolution wallpaper of ${subject}. Designed as a finished ${device === 'desktop' ? 'desktop' : 'phone'} wallpaper, not a mockup or collage.`,
    `Composition & layout: ${orientation}. Clear single focal point, balanced negative space, no busy center-cluster, works as a home/lock-screen backdrop behind app icons and widgets.`,
    `Visual style & materials: ${tpl.name} template (${tpl.id}). ${tpl.guidance} Palette: ${pal}. Rich material detail, soft depth of field, cinematic grading.`,
    `Text & labels: No text, no logos, no watermarks, no UI elements, no signatures anywhere in the image.`,
    `Aspect ratio & output: ${spec.ratio} (${spec.width}×${spec.height}), edge-to-edge bleed, no borders, no frames, no vignette so dark corners.`,
    `Constraints: ${tpl.pitfalls} Avoid clutter, low-res artifacts, banding, and duplicated subjects. Keep it premium, calm, and iconic at a glance. ${extra ? extra.trim() : ''}`.trim(),
  ].join('\n');
}

/* One-click prompt for a suggestion object */
export function promptForSuggestion(s) {
  return buildPrompt({
    category: s.category,
    device: s.device,
    subject: s.subject,
    palette: s.palette,
    template: s.template,
  });
}
