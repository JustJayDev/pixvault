import React from 'react'
import { Link } from 'react-router-dom'
import VaultLogo from '../components/VaultLogo.jsx'

export default function About() {
  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit">
          <VaultLogo size={56} open />
        </div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          About <span className="grad-text">PixVault</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          One vault. Every wallpaper in the exact quality it was made.
        </p>
      </div>

      <div className="glass mt-8 space-y-4 rounded-3xl p-6 text-sm leading-relaxed text-slate-300">
        <p>
          Most wallpaper sites hit you with popups, shrink your download to a blurry preview, or slap a watermark on it. PixVault does the opposite:
        </p>
        <ul className="space-y-2">
          {[
            ['🔓', 'Original files only', 'The download button gives you the exact file from the vault — same pixels, same size, zero recompression.'],
            ['🚫', 'No watermarks, ever', 'Nothing is added, cropped or branded on your wallpaper.'],
            ['⚡', 'No signup, no ads-wall', 'Tap download. It is yours. That is the whole flow.'],
            ['📱', 'Phone-first', 'Designed on a phone, for phones. Installable as an app and works offline.'],
          ].map(([i, t, d]) => (
            <li key={t} className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <span className="text-xl">{i}</span>
              <div>
                <p className="font-display font-semibold text-white">{t}</p>
                <p className="mt-0.5 text-xs text-slate-400">{d}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-slate-400">
          PixVault is curated by <span className="text-white">Jay</span> — every wallpaper is hand-picked before it enters the vault. New drops land regularly.
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="btn-primary shine">Open the vault</Link>
      </div>
    </div>
  )
}