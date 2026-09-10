import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { byId, related, origUrl, thumbUrl, formatRes } from '../lib/wallpapers.js'
import WallpaperCard from '../components/WallpaperCard.jsx'
import NotFound from './NotFound.jsx'

function fitToScreen(img, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const scale = Math.max(w / img.width, h / img.height)
  const cw = img.width * scale
  const ch = img.height * scale
  ctx.drawImage(img, (w - cw) / 2, (h - ch) / 2, cw, ch)
  canvas.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pixvault-${w}x${h}.jpg`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    },
    'image/jpeg',
    0.95,
  )
}

export default function WallpaperDetail() {
  const { id } = useParams()
  const w = byId(id)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    document.title = w ? `${w.title} — PixVault` : 'Not found — PixVault'
    return () => {
      document.title = 'PixVault — Wallpapers in full quality. Always.'
    }
  }, [w])

  if (!w) return <NotFound />

  const rel = related(w)

  const downloadOriginal = async () => {
    try {
      const res = await fetch(origUrl(w))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pixvault-${w.id}.jpg`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch {
      window.open(origUrl(w), '_blank')
    }
  }

  return (
    <div className="animate-fade-up">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to vault
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        {/* preview */}
        <div className="animate-pop-in relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl shadow-black/50">
          <img
            src={origUrl(w)}
            alt={w.title}
            className={`max-h-[78vh] w-full cursor-zoom-in object-contain transition-transform duration-500 ${zoom ? 'scale-110' : ''}`}
            onClick={() => setZoom(!zoom)}
          />
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-bold backdrop-blur">{formatRes(w)}</span>
        </div>

        {/* info panel */}
        <div className="flex flex-col">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{w.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip">#{w.category}</span>
            {(w.tags || []).map((t) => (
              <Link key={t} to={`/tag/${t}`} className="chip">#{t}</Link>
            ))}
          </div>

          <div className="glass mt-6 grid grid-cols-3 gap-2 rounded-2xl p-4 text-center">
            <div>
              <p className="font-display text-lg font-bold text-white">{formatRes(w)}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">resolution</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">{w.size} MB</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">file size</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold grad-text">{w.file.split('.').pop().toUpperCase()}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">format</p>
            </div>
            </div>

          {/* download actions */}
          <div className="mt-6 space-y-3">
            <button onClick={downloadOriginal} className="btn-primary shine w-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Download original
            </button>
            <button
              onClick={() => {
                const img = new Image()
                img.onload = () => fitToScreen(img, w.width, w.height)
                img.src = origUrl(w)
              }}
              className="btn-ghost w-full"
            >
              Fit to screen (exact size)
            </button>
            <p className="text-center text-xs text-slate-500">Original file · {w.size} MB · never recompressed</p>
          </div>

          <div className="glass mt-6 rounded-2xl p-4 text-xs leading-relaxed text-slate-400">
            <p className="font-display text-sm font-semibold text-white">🔒 Quality promise</p>
            <p className="mt-1">
              This is the exact file from the vault. PixVault never adds watermarks, never crops, and never compresses. Use freely for personal use.
            </p>
          </div>
        </div>
      </div>

      {rel.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold">More like this</h2>
          <div className="mt-4 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {rel.map((r, i) => (
              <WallpaperCard key={r.id} w={r} index={i} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/" className="btn-ghost">Open the full vault</Link>
          </div>
        </section>
      )}
    </div>
  )
}