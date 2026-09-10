import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { thumbUrl, origUrl, formatRes, resLabel } from '../lib/wallpapers.js'

export default function WallpaperCard({ w, index = 0 }) {
  const [loaded, setLoaded] = useState(false)
  const [src, setSrc] = useState(() => thumbUrl(w))

  return (
    <Link
      to={`/w/${w.id}`}
      className="group card-shine relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-vault-violet/40 hover:shadow-xl hover:shadow-vault-violet/20 active:scale-[.98]"
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
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-80 transition-opacity group-hover:opacity-95" />

        <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur">
          {resLabel(w)}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-white">{w.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-300">{formatRes(w)}</p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-vault-violet to-vault-cyan opacity-0 shadow-lg shadow-vault-violet/40 transition-all duration-300 group-hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}