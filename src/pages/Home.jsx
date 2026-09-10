import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { wallpapers, categories, filterWallpapers } from '../lib/wallpapers.js'
import WallpaperCard from '../components/WallpaperCard.jsx'
import VaultLogo from '../components/VaultLogo.jsx'

export default function Home() {
  const { tag } = useParams()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    setCategory('all')
    setQuery('')
  }, [tag])

  const list = useMemo(() => {
    let items = filterWallpapers({ category, query, tag: tag || '' })
    if (category === 'all' && !query && !tag) {
      items = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
    return items
  }, [category, query, tag])

  return (
    <div className="animate-fade-up">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-12 text-center sm:py-16" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,.25), transparent 60%), radial-gradient(ellipse 60% 50% at 85% 110%, rgba(34,211,238,.14), transparent 60%)' }}>
        <div className="animate-vault-open mx-auto mb-5 w-fit">
          <VaultLogo size={72} open />
        </div>
        <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-5xl" style={{ animationDelay: '150ms' }}>
          Wallpapers in <span className="grad-text">full quality</span>.<br />Always.
        </h1>
        <p className="animate-fade-up mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base" style={{ animationDelay: '280ms' }}>
          A hand-picked vault of HD & 4K wallpapers. Every download is the untouched original file — zero compression, zero watermark, zero signup.
        </p>

        <div className="animate-fade-up mx-auto mt-7 flex max-w-md items-center gap-2" style={{ animationDelay: '400ms' }}>
          <div className="glass relative flex-1 rounded-2xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search wallpapers…"
              className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>
          <span className="glass hidden rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 sm:block">{wallpapers.length}</span>
        </div>
      </section>

      {/* ---------- CATEGORY CHIPS ---------- */}
      <section className="mt-8">
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? 'chip-active' : ''}`}>
              {c === 'all' ? '✦ All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
          {tag && <span className="chip chip-active">#{tag}</span>}
        </div>
      </section>

      {/* ---------- GRID ---------- */}
      <section className="mt-6">
        {list.length === 0 ? (
          <div className="glass animate-pop-in rounded-3xl px-6 py-16 text-center">
            <p className="text-4xl">🕳️</p>
            <p className="mt-3 font-display text-lg font-semibold">Nothing in this chamber</p>
            <p className="mt-1 text-sm text-slate-400">Try another category or search term.</p>
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {list.map((w, i) => (
              <WallpaperCard key={w.id} w={w} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- QUALITY PROMISE STRIP ---------- */}
      <section className="mt-12">
        <div className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-3">
          {[
            ['🔒', 'Original files only', 'Never recompressed. What Jay uploads is exactly what you get.'],
            ['⚡', 'Instant & free', 'No account, no ads-wall, no redirects. Tap and it is yours.'],
            ['📱', 'Made for phones', 'Built mobile-first, installable as an app, works offline.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-display font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}