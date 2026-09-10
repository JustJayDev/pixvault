import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { wallpapers, filterWallpapers } from '../lib/wallpapers.js'
import WallpaperCard from '../components/WallpaperCard.jsx'
import VaultLogo from '../components/VaultLogo.jsx'
import { Reveal, Words, Tilt } from '../components/motion.jsx'
import { IconTile, IconLock, IconBolt, IconPhone, IconSearch, IconImage } from '../components/icons.jsx'

function Hero({ query, onSearch }) {
  const featured = wallpapers.filter((w) => w.featured).slice(0, 3)
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-14 text-center sm:py-20"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,.28), transparent 60%), radial-gradient(ellipse 60% 50% at 85% 110%, rgba(34,211,238,.15), transparent 60%)' }}>
      <div className="animate-vault-open mx-auto mb-6 w-fit">
        <VaultLogo size={76} open />
      </div>

      <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
        <Words text="Wallpapers in" startDelay={150} />
        <br />
        <span className="grad-text"><Words text="full quality." startDelay={300} /></span>
        <br />
        <Words text="Always." startDelay={480} />
      </h1>

      <p className="animate-fade-up mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base" style={{ animationDelay: '650ms' }}>
        A hand-picked vault of HD & 4K wallpapers. Every download is the untouched original file — zero compression, zero watermark, zero signup.
      </p>

      <div className="animate-fade-up mx-auto mt-8 flex max-w-md items-center gap-2" style={{ animationDelay: '800ms' }}>
        <div className="glass relative flex-1 rounded-2xl transition-all duration-300 focus-within:border-vault-violet/50 focus-within:shadow-lg focus-within:shadow-vault-violet/20">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <IconSearch />
          </span>
          <input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search wallpapers…"
            className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none"
          />
        </div>
        <span className="glass hidden rounded-2xl px-4 py-3 font-display text-sm font-bold text-slate-200 sm:block">{wallpapers.length}</span>
      </div>

      {/* floating featured cards */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        {featured.map((w, i) => (
          <div key={w.id}
            className={`absolute w-40 overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/50 ${i === 1 ? 'animate-float-slower' : 'animate-float-slow'}`}
            style={{
              [i === 0 ? 'left' : 'right']: '3%',
              top: i === 1 ? '58%' : i === 0 ? '18%' : '12%',
              opacity: .85,
              transform: `rotate(${i === 0 ? -6 : i === 1 ? 5 : -4}deg)`,
            }}>
            <img src={`${import.meta.env.BASE_URL}wallpapers/thumbs/${w.file.replace(/\.[^.]+$/, '.webp')}`} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const { tag } = useParams()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => { setCategory('all'); setQuery('') }, [tag])

  const list = useMemo(() => {
    let items = filterWallpapers({ category, query, tag: tag || '' })
    if (category === 'all' && !query && !tag) {
      items = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
    return items
  }, [category, query, tag])

  return (
    <div>
      <Hero query={query} onSearch={setQuery} />
      <CategoryBar category={category} setCategory={setCategory} tag={tag} />
      <Grid list={list} tag={tag} />
      <PromiseStrip />
      <Marquee />
    </div>
  )
}

function CategoryBar({ category, setCategory, tag }) {
  const cats = ['all', ...Array.from(new Set(wallpapers.map((w) => w.category)))]
  return (
    <Reveal className="mt-8">
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {cats.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? 'chip-active' : ''}`}>
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        {tag && <span className="chip chip-active">#{tag}</span>}
      </div>
    </Reveal>
  )
}

function Grid({ list, tag }) {
  return (
    <section className="mt-6">
      {list.length === 0 ? (
        <Reveal className="glass rounded-3xl px-6 py-16 text-center">
          <div className="mx-auto w-fit opacity-80">
            <IconTile size={56} tint="violet"><IconImage size={26} /></IconTile>
          </div>
          <p className="mt-4 font-display text-lg font-semibold">Nothing in this chamber</p>
          <p className="mt-1 text-sm text-slate-400">Try another category or search term.</p>
        </Reveal>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {list.map((w, i) => (
            <WallpaperCard key={w.id} w={w} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}

function PromiseStrip() {
  const items = [
    { icon: <IconLock />, tint: 'violet', title: 'Original files only', desc: 'Never recompressed. What Jay uploads is exactly what you get — same pixels, same size.' },
    { icon: <IconBolt />, tint: 'amber', title: 'Instant & free', desc: 'No account, no ad-wall, no redirects. Tap download and it is yours.' },
    { icon: <IconPhone />, tint: 'cyan', title: 'Made for phones', desc: 'Built mobile-first, installable as an app, works offline in the vault.' },
  ]
  return (
    <section className="mt-14">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 120}>
            <Tilt className="glass h-full rounded-3xl p-5">
              <div className="flex flex-col gap-3">
                <IconTile tint={it.tint}>{it.icon}</IconTile>
                <div>
                  <p className="font-display font-semibold text-white">{it.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{it.desc}</p>
                </div>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Marquee() {
  const words = ['4K ORIGINALS', 'NO WATERMARK', 'NO SIGNUP', 'FREE FOREVER', 'HD VAULT', 'OFFLINE READY']
  const row = [...words, ...words]
  return (
    <section className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] py-3.5" aria-hidden="true">
      <div className="marquee-track">
        {row.map((w, i) => (
          <span key={i} className="mx-6 flex items-center gap-6 whitespace-nowrap font-display text-xs font-bold tracking-[.25em] text-slate-500">
            {w}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-br from-vault-violet to-vault-cyan" />
          </span>
        ))}
      </div>
    </section>
  )
}