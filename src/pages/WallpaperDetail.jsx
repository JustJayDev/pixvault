import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { byId, related, origUrl, formatRes } from '../lib/wallpapers.js'
import WallpaperCard from '../components/WallpaperCard.jsx'
import NotFound from './NotFound.jsx'
import { Reveal } from '../components/motion.jsx'
import { IconTile, IconShield, IconDownload, IconExpand, IconChevronLeft } from '../components/icons.jsx'

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

function Stat({ value, label, grad = false }) {
  return (
    <div className="text-center">
      <p className={`font-display text-lg font-bold ${grad ? 'grad-text' : 'text-white'}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[.15em] text-slate-500">{label}</p>
    </div>
  )
}

export default function WallpaperDetail() {
  const { id } = useParams()
  const w = byId(id)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    document.title = w ? `${w.title} — PixVault` : 'Not found — PixVault'
    return () => { document.title = 'PixVault — Wallpapers in full quality. Always.' }
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
    <div>
      <Link to="/" className="group inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white">
        <span className="transition-transform duration-300 group-hover:-translate-x-1"><IconChevronLeft /></span>
        Back to vault
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        {/* preview */}
        <Reveal className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl shadow-black/50">
          <img
            src={origUrl(w)}
            alt={w.title}
            className={`max-h-[78vh] w-full cursor-zoom-in object-contain transition-transform duration-700 ease-out-expo ${zoom ? 'scale-110' : 'scale-100'}`}
            onClick={() => setZoom(!zoom)}
          />
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-bold backdrop-blur">{formatRes(w)}</span>
          <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur">
            <IconExpand size={13} /> tap to zoom
          </span>
        </Reveal>

        {/* info panel */}
        <div>
          <Reveal delay={100}>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{w.title}</h1>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">#{w.category}</span>
              {(w.tags || []).map((t) => (
                <Link key={t} to={`/tag/${t}`} className="chip">#{t}</Link>
              ))}
            </div>
          </Reveal>

          <Reveal delay={260}>
            <div className="glass mt-6 grid grid-cols-3 gap-2 rounded-2xl p-4">
              <Stat value={formatRes(w)} label="resolution" />
              <Stat value={`${w.size} MB`} label="file size" />
              <Stat value={w.file.split('.').pop().toUpperCase()} label="format" grad />
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-6 space-y-3">
              <button onClick={downloadOriginal} className="btn-primary shine w-full">
                <IconDownload />
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
          </Reveal>

          <Reveal delay={420}>
            <div className="glass mt-6 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <IconTile size={38} tint="cyan"><IconShield size={18} /></IconTile>
                <div>
                  <p className="font-display text-sm font-semibold text-white">Quality promise</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    This is the exact file from the vault. PixVault never adds watermarks, never crops, and never compresses. Free for personal use.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {rel.length > 0 && (
        <section className="mt-14">
          <Reveal>
            <h2 className="font-display text-xl font-bold">More like this</h2>
          </Reveal>
          <div className="mt-4 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {rel.map((r, i) => (
              <WallpaperCard key={r.id} w={r} index={i} />
            ))}
          </div>
          <Reveal className="mt-8 text-center">
            <Link to="/" className="btn-ghost">Open the full vault</Link>
          </Reveal>
        </section>
      )}
    </div>
  )
}