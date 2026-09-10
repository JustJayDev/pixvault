import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { wallpapers, filterWallpapers, latest, top, randomOf, trendingTags } from '../lib/wallpapers.js'
import WallpaperCard from '../components/WallpaperCard.jsx'
import VaultLogo from '../components/VaultLogo.jsx'
import { Reveal, Words, Tilt } from '../components/motion.jsx'
import { IconTile, IconLock, IconBolt, IconPhone, IconSearch, IconImage, IconSpark, IconArrow } from '../components/icons.jsx'

function Hero({ query, onSearch, onRandom }) {
  const featured = wallpapers.filter((w) => w.featured).slice(0, 3)
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 px-5 py-12 text-center sm:px-6 sm:py-20"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,.28), transparent 60%), radial-gradient(ellipse 60% 50% at 85% 110%, rgba(34,211,238,.15), transparent 60%)' }}>
      <div className="animate-vault-open mx-auto mb-6 w-fit">
        <VaultLogo size={76} open />
      </div>

      <h1 className="hero-title font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
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
        <button onClick={onRandom} className="glass flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl text-slate-300 transition-all duration-300 hover:border-vault-violet/50 hover:text-white active:scale-95" title="Shuffle" aria-label="Shuffle wallpapers">
          <IconSpark size={19} />
        </button>
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
  const [sort, setSort] = useState('latest')
  const [randSeed, setRandSeed] = useState(0)

  useEffect(() => { setCategory('all'); setQuery(''); setSort('latest') }, [tag])

  const list = useMemo(() => {
    let items = filterWallpapers({ category, query, tag: tag || '' })
    if (sort === 'top') items = items.filter((w) => top.includes(w)).sort((a, b) => top.indexOf(a) - top.indexOf(b))
    else if (sort === 'random') {
      // deterministic shuffle per seed so re-renders keep order until reshuffle
      const seed = randSeed
      items = [...items].map((w) => ({ w, k: Math.sin(seed * 999 + w.id.length * 31 + w.width) })).sort((a, b) => a.k - b.k).map((x) => x.w)
    } else items = items.filter((w) => latest.includes(w)).sort((a, b) => latest.indexOf(a) - latest.indexOf(b))
    if (category === 'all' && !query && !tag && sort === 'latest') {
      items = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
    return items
  }, [category, query, tag, sort, randSeed])

  const shuffle = () => { setSort('random'); setRandSeed((s) => s + 1) }

  return (
    <div>
      <Hero query={query} onSearch={setQuery} onRandom={shuffle} />
      <CategoryBar category={category} setCategory={setCategory} tag={tag} />
      <SortBar sort={sort} setSort={setSort} count={list.length} />
      <TrendingRow activeTag={tag} />
      <Grid list={list} tag={tag} />
      <PromiseStrip />
      <Marquee />
    </div>
  )
}

function SortBar({ sort, setSort, count }) {
  const tabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'top', label: 'Top' },
    { id: 'random', label: 'Random' },
  ]
  return (
    <Reveal className="mt-4 flex items-center justify-between gap-3">
      <div className="glass flex rounded-full p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setSort(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 ${sort === t.id ? 'bg-gradient-to-r from-vault-violet to-vault-cyan text-white shadow-lg shadow-vault-violet/30' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-500">{count} {count === 1 ? 'wallpaper' : 'wallpapers'}</span>
    </Reveal>
  )
}

function TrendingRow({ activeTag }) {
  if (!trendingTags.length) return null
  return (
    <Reveal className="mt-4">
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-slate-500">
          <IconSpark size={13} /> Trending
        </span>
        {trendingTags.map((t) => (
          <Link key={t} to={`/tag/${t}`} className={`chip shrink-0 !py-1.5 !text-xs ${activeTag === t ? 'chip-active' : ''}`}>#{t}</Link>
        ))}
      </div>
    </Reveal>
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