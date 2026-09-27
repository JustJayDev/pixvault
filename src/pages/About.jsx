import React from 'react';
import { ShieldCheck, Zap, Infinity as InfinityIcon, Heart, Download, Image as ImageIcon } from 'lucide-react';
import { useReveal } from '../lib/useReveal';
import { wallpapers } from '../lib/wallpapers';

const PROMISES = [
  {
    icon: ShieldCheck,
    title: 'Original quality, always',
    body: 'Every download is the untouched original file. No recompression, no quality loss, no resizing — the exact pixels Jay uploaded.',
  },
  {
    icon: Zap,
    title: 'Instant downloads',
    body: 'One tap and the full-resolution file is yours. No waiting screens, no intermediate pages, no email gates.',
  },
  {
    icon: InfinityIcon,
    title: 'Free forever',
    body: 'No account, no paywall, no premium tier hidden behind a subscription. The whole vault is free, always.',
  },
  {
    icon: Heart,
    title: 'No watermarks',
    body: 'Nothing is stamped, branded or marked. The art stays exactly as the creator intended — clean.',
  },
];

const About = () => {
  useReveal();
  return (
    <div className="wrap" style={{ paddingTop: 56, paddingBottom: 20 }}>
      <span className="eyebrow reveal">About the vault</span>
      <h1
        className="font-serif reveal d1"
        style={{
          fontSize: 'clamp(34px, 6vw, 58px)',
          fontWeight: 700,
          lineHeight: 1.04,
          letterSpacing: '-0.025em',
          margin: '16px 0 0',
        }}
      >
        Wallpapers, <span className="text-gradient">respected.</span>
      </h1>
      <p
        className="reveal d2"
        style={{
          fontSize: 'clamp(15px, 2.2vw, 18px)',
          color: 'var(--muted)',
          maxWidth: 620,
          lineHeight: 1.65,
          margin: '18px 0 0',
        }}
      >
        Most wallpaper sites hit you with popups, recompress every image, stamp a
        watermark on it, then ask you to sign up just to download. PixVault does
        the opposite — a quiet, fast, gallery-grade vault where what you tap is
        exactly what you get.
      </p>

      <div
        className="reveal d3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginTop: 40,
        }}
      >
        {PROMISES.map((p) => (
          <div
            key={p.title}
            style={{
              padding: 22,
              borderRadius: 14,
              border: '1px solid var(--line)',
              background: 'rgba(28,25,23,0.5)',
            }}
          >
            <p.icon size={20} style={{ color: 'var(--accent)' }} />
            <div
              className="font-serif"
              style={{ fontSize: 17, fontWeight: 700, marginTop: 12 }}
            >
              {p.title}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.65, margin: '8px 0 0' }}>
              {p.body}
            </p>
          </div>
        ))}
      </div>

      <div
        className="reveal"
        style={{
          marginTop: 40,
          padding: 26,
          borderRadius: 16,
          border: '1px solid var(--line)',
          background: 'rgba(28,25,23,0.5)',
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 40 }}>
          <Download size={36} style={{ color: 'var(--accent)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="font-serif" style={{ fontSize: 19, fontWeight: 700 }}>
            {wallpapers.length} wallpapers in the vault
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.6 }}>
            Curated by Jay Kumar — mobile gamer, builder, and creator behind{' '}
            <a
              href="https://justjaydev.github.io"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              JustJayDev
            </a>
            . New drops land regularly.
          </p>
        </div>
        <span className="pill">
          <ImageIcon size={13} /> Made on a phone
        </span>
      </div>
    </div>
  );
};

export default About;