import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, ShieldCheck, Zap, Infinity as InfinityIcon, Heart, Download, ArrowRight } from 'lucide-react';
import {
  filterWallpapers,
  getCategories,
  getFavs,
  toggleFav,
  wallpapers,
  thumbUrl,
} from '../lib/wallpapers';
import { useReveal } from '../lib/useReveal';
import WallpaperCard from '../components/WallpaperCard';
import Lightbox from '../components/Lightbox';

const SORTS = [
  { key: 'latest', label: 'Latest' },
  { key: 'featured', label: 'Featured' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'shuffle', label: 'Shuffle' },
];

const DEVICES = [
  { key: 'all', label: 'All' },
  { key: 'phone', label: 'Phone' },
  { key: 'desktop', label: 'Desktop' },
];

/* count-up animation for hero stats */
function useCountUp(target, run, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return v;
}

const Home = () => {
  useReveal();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [device, setDevice] = useState('all');
  const [sort, setSort] = useState('latest');
  const [favsOnly, setFavsOnly] = useState(false);
  const [favs, setFavs] = useState([]);
  const [lbIndex, setLbIndex] = useState(null);
  const [statsRun, setStatsRun] = useState(false);
  const [stuck, setStuck] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setFavs(getFavs());
    const t = setTimeout(() => setStatsRun(true), 250);
    return () => clearTimeout(t);
  }, []);

  const categories = useMemo(() => getCategories(), []);
  const allCount = useMemo(() => wallpapers.length, []);
  const featuredList = useMemo(() => wallpapers.filter((w) => w.featured).slice(0, 8), []);

  const list = useMemo(
    () => filterWallpapers({ q, category, device, sort, favoritesOnly: favsOnly, favs }),
    [q, category, device, sort, favsOnly, favs]
  );

  const handleFav = (id) => setFavs(toggleFav(id));

  const hasFilters = q || category !== 'all' || device !== 'all' || favsOnly;

  const statCount = useCountUp(allCount, statsRun);
  const catCount = useCountUp(categories.length, statsRun, 900);

  const clearAll = () => {
    setQ('');
    setCategory('all');
    setDevice('all');
    setFavsOnly(false);
  };

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-aurora" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="wrap">
          <span className="eyebrow reveal">The Wallpaper Vault</span>
          <h1 className="reveal d1">
            Wallpapers in <span className="text-gradient">full quality.</span>
            <br />
            Always.
          </h1>
          <p className="hero-sub reveal d2">
            A curated vault of HD &amp; 4K wallpapers for phone and desktop. Every
            download is the untouched original — no compression, no watermark,
            no signup. Ever.
          </p>
          <div className="pill-row reveal d3">
            <span className="pill"><ShieldCheck size={13} /> Original quality</span>
            <span className="pill"><Zap size={13} /> Instant download</span>
            <span className="pill"><InfinityIcon size={13} /> Free forever</span>
            <span className="pill"><Sparkles size={13} /> Curated by Jay</span>
          </div>

          <div className="stat-row reveal d4">
            <div className="stat-card">
              <div className="stat-num">{statCount}</div>
              <div className="stat-lbl">Wallpapers</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{catCount}</div>
              <div className="stat-lbl">Categories</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">4K</div>
              <div className="stat-lbl">Max resolution</div>
            </div></div>
        </div>

        {/* ================= MARQUEE ================= */}
        {featuredList.length > 0 && (
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[...featuredList, ...featuredList].map((w, i) => (
                <div className="marquee-item" key={w.id + '-' + i}>
                  <img src={thumbUrl(w)} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="wrap">
        <hr className="rule" />

        {/* ================= FILTER BAR ================= */}
        <div className={"filterbar-sticky reveal" + (stuck ? " stuck" : "")}>
          <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="searchbar" style={{ flex: 1, minWidth: 220 }}>
                <Search size={15} style={{ color: 'var(--dim)', flex: 'none' }} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search wallpapers, tags, categories…"
                  aria-label="search wallpapers"
                />
                {q && (
                  <button
                    onClick={() => setQ('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', display: 'flex', padding: 0 }}
                    aria-label="clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <label className="toggle" style={{ flex: 'none' }}>
                <input
                  type="checkbox"
                  checked={favsOnly}
                  onChange={(e) => setFavsOnly(e.target.checked)}
                />
                <span className="track" />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Heart size={13} fill={favsOnly ? 'currentColor' : 'none'} />
                  {favs.length > 0 ? `Favorites (${favs.length})` : 'Favorites'}
                </span>
              </label>
            </div>

            {/* category chips */}
            <div className="d1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className={'chip' + (category === 'all' ? ' active' : '')}
                onClick={() => setCategory('all')}
              >
                All <span className="count">{allCount}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  className={'chip' + (category === c.name ? ' active' : '')}
                  onClick={() => setCategory(c.name)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{c.name}</span>{' '}
                  <span className="count">{c.count}</span>
                </button>
              ))}
            </div>

            {/* device + sort row */}
            <div className="d2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {DEVICES.map((d) => (
                <button
                  key={d.key}
                  className={'chip' + (device === d.key ? ' active' : '')}
                  onClick={() => setDevice(d.key)}
                >
                  {d.label}
                </button>
              ))}
              <span style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 4px' }} />
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  className={'chip' + (sort === s.key ? ' active' : '')}
                  onClick={() => setSort(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RESULT COUNT ================= */}
        <div
          className="font-mono"
          style={{ marginTop: 22, fontSize: 12, color: 'var(--dim)' }}
        >
          &gt; {favsOnly ? 'showing favorites · ' : ''}
          {list.length} {list.length === 1 ? 'wallpaper' : 'wallpapers'}
          {q ? ` matching “${q}”` : ''}
          {category !== 'all' ? ` in ${category}` : ''}
        </div>

        {/* ================= MASONRY GRID ================= */}
        {list.length > 0 ? (
          <div className="masonry stagger in" style={{ marginTop: 18, paddingBottom: 20 }} ref={gridRef}>
            {list.map((wp, i) => (
              <WallpaperCard
                key={wp.id}
                wp={wp}
                index={i}
                isFav={favs.includes(wp.id)}
                onFav={handleFav}
                onOpen={() => setLbIndex(i)}
              />
            ))}
          </div>
        ) : (
          <div
            className="reveal"
            style={{
              marginTop: 28,
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid var(--line)',
              borderRadius: 16,
              background: 'rgba(28,25,23,0.5)',
            }}
          >
            <div style={{ fontSize: 34 }}>🗂️</div>
            <div className="font-serif" style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>
              Nothing in this chamber
            </div>
            <p className="font-mono" style={{ color: 'var(--muted)', fontSize: 13, margin: '8px 0 18px' }}>
              &gt; no wallpapers match{q ? ` “${q}”` : ''}{category !== 'all' ? ` in ${category}` : ''}
            </p>
            {hasFilters && (
              <button className="btn btn-sm" onClick={clearAll}>
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================= LIGHTBOX ================= */}
      {lbIndex !== null && (
        <Lightbox
          list={list}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onIndex={setLbIndex}
          isFav={(id) => favs.includes(id)}
          onFav={handleFav}
        />
      )}
    </>
  );
};

export default Home;