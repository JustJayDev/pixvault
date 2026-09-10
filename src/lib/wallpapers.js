import data from '../data/wallpapers.json'

export const wallpapers = data
export const BASE = import.meta.env.BASE_URL

export const origUrl = (w) => `${BASE}wallpapers/${w.file}`
export const thumbUrl = (w) =>
  `${BASE}wallpapers/thumbs/${w.file.replace(/\.[^.]+$/, '.webp')}`

export const categories = [
  'all',
  ...Array.from(new Set(wallpapers.map((w) => w.category))),
]

export function filterWallpapers({ category = 'all', query = '', tag = '' }) {
  const q = query.trim().toLowerCase()
  return wallpapers.filter((w) => {
    if (category !== 'all' && w.category !== category) return false
    if (tag && !(w.tags || []).includes(tag)) return false
    if (q && !`${w.title} ${w.category} ${(w.tags || []).join(' ')}`.toLowerCase().includes(q))
      return false
    return true
  })
}

export const formatRes = (w) => `${w.width} × ${w.height}`
export const resLabel = (w) =>
  Math.max(w.width, w.height) >= 3800 ? '4K' : Math.max(w.width, w.height) >= 2000 ? '2K' : 'HD'
export const byId = (id) => wallpapers.find((w) => w.id === id)

/* ---- Wallhaven-inspired discovery ---- */
export const latest = [...wallpapers].reverse()
export const top = [...wallpapers].sort(
  (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.width * b.height - a.width * a.height,
)

export function randomOf(list = wallpapers) {
  return list.length ? list[Math.floor(Math.random() * list.length)] : null
}

export const trendingTags = Object.entries(
  wallpapers.reduce((acc, w) => {
    for (const t of w.tags || []) acc[t] = (acc[t] || 0) + 1
    return acc
  }, {}),
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([t]) => t)

export const related = (w, n = 4) => {
  const same = wallpapers.filter((x) => x.id !== w.id && x.category === w.category)
  if (same.length >= n) return same.slice(0, n)
  const rest = latest.filter((x) => x.id !== w.id && !same.includes(x))
  return [...same, ...rest].slice(0, n)
}