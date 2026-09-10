import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { thumbUrl, origUrl, formatRes, resLabel } from '../lib/wallpapers.js'

export default function WallpaperCard({ w, index = 0 }) {
  const [loaded, setLoaded] = useState(false)
  const [src, setSrc] = useState(() => thumbUrl(w))

  const onMove = (e) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.transform = `perspective(900px) rotateY(${(px - .5) * 8}deg) rotateX(${(.5 - py) * 8}deg) translateY(-4px)`
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }
  const onLeave = (e) => {
    e.currentTarget.style.transform = ''
  }

  return (
    <Link
      to={`/w/${w.id}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group card-shine relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/30 transition-[transform,border-color,box-shadow] duration-500 ease-out-expo hover:border-vault-violet/50 hover:shadow-xl hover:shadow-vault-violet/25 active:scale-[.98]"
      style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
    >
      <div className="relative w-full" style={{ aspectRatio: `${w.width} / ${w.height}` }}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />}
        <img
          src={src}
          alt={w.title}
          loading={index < 6 ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => src !== origUrl(w) && setSrc(origUrl(w))}
          className={`blur-up h-full w-full object-cover ${loaded ? 'loaded' : ''}`}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-100" />

        {/* cursor glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: 'radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(168,85,247,.22), transparent 65%)' }}
        />

        <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur transition-transform duration-300 group-hover:scale-105">
          {resLabel(w)}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-white transition-transform duration-300 group-hover:-translate-y-0.5">{w.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-300 transition-transform duration-300 group-hover:-translate-y-0.5">{formatRes(w)}</p>
          </div>
          <span className="group-show-tap flex h-9 w-9 shrink-0 translate-y-2 items-center justify-center rounded-full bg-gradient-to-br from-vault-violet to-vault-cyan opacity-0 shadow-lg shadow-vault-violet/40 transition-all duration-300 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}