import React from 'react'
import { Link } from 'react-router-dom'
import VaultLogo from '../components/VaultLogo.jsx'
import { Reveal, Tilt } from '../components/motion.jsx'
import { IconTile, IconUnlock, IconBan, IconBolt, IconPhone } from '../components/icons.jsx'

export default function About() {
  const points = [
    { icon: <IconUnlock />, tint: 'violet', title: 'Original files only', desc: 'The download button gives you the exact file from the vault — same pixels, same size, zero recompression.' },
    { icon: <IconBan />, tint: 'fuchsia', title: 'No watermarks, ever', desc: 'Nothing is added, cropped or branded on your wallpaper. Clean as made.' },
    { icon: <IconBolt />, tint: 'amber', title: 'No signup, no ad-wall', desc: 'Tap download. It is yours. That is the whole flow.' },
    { icon: <IconPhone />, tint: 'cyan', title: 'Phone-first', desc: 'Designed on a phone, for phones. Installable as an app and works offline.' },
  ]
  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="text-center">
        <div className="mx-auto mb-4 w-fit">
          <VaultLogo size={56} open />
        </div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          About <span className="grad-text">PixVault</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          One vault. Every wallpaper in the exact quality it was made.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-8">
        <div className="glass rounded-3xl p-6 text-sm leading-relaxed text-slate-300">
          <p>
            Most wallpaper sites hit you with popups, shrink your download to a blurry preview, or slap a watermark on it. PixVault does the opposite:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {points.map((p) => (
              <div key={p.title} className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                <IconTile size={40} tint={p.tint}>{p.icon}</IconTile>
                <div>
                  <p className="font-display font-semibold text-white">{p.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-slate-400">
            PixVault is curated by <span className="text-white">Jay</span> — every wallpaper is hand-picked before it enters the vault. New drops land regularly.
          </p>
        </div>
      </Reveal>

      <Reveal delay={200} className="mt-8 text-center">
        <Link to="/" className="btn-primary shine">Open the vault</Link>
      </Reveal>
    </div>
  )
}