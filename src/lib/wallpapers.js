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
export const related = (w, n = 4) =>
  wallpapers.filter((x) => x.id !== w.id && x.category === w.category).slice(0, n)