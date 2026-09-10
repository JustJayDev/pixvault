import React from 'react'

const base = (size, sw = 1.8) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
})

export function IconTile({ children, size = 44, tint = 'violet' }) {
  const tints = {
    violet: 'from-violet-500/25 to-violet-500/5 text-violet-300 shadow-violet-500/20',
    cyan: 'from-cyan-400/25 to-cyan-400/5 text-cyan-300 shadow-cyan-400/20',
    fuchsia: 'from-fuchsia-500/25 to-fuchsia-500/5 text-fuchsia-300 shadow-fuchsia-500/20',
    amber: 'from-amber-400/25 to-amber-400/5 text-amber-300 shadow-amber-400/20',
  }
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br shadow-lg backdrop-blur-sm ${tints[tint]}`} style={{ width: size, height: size }}>
      {children}
    </span>
  )
}

export const IconLock = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const IconBolt = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M13 2 4.5 13.5H11L9.8 22l8.7-11.5H12L13 2Z" />
  </svg>
)

export const IconPhone = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M10.5 5h3" />
    <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

export const IconShield = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8 7.5 9.9 4.3-1.9 7.5-5.3 7.5-9.9v-6L12 2.5Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9.5" />
  </svg>
)

export const IconBan = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.8 5.8l12.4 12.4" />
  </svg>
)

export const IconUnlock = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7a4 4 0 0 1 7.7-1.5" />
  </svg>
)

export const IconSpark = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
)

export const IconLayers = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3.5 12.5 8.5 4.7 8.5-4.7" />
    <path d="m3.5 16.5 8.5 4.7 8.5-4.7" />
  </svg>
)

export const IconDownload = ({ size = 20, sw = 2 }) => (
  <svg {...base(size, sw)}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

export const IconSearch = ({ size = 18 }) => (
  <svg {...base(size, 2)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const IconArrow = ({ size = 16 }) => (
  <svg {...base(size, 2.2)}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
)

export const IconChevronLeft = ({ size = 16 }) => (
  <svg {...base(size, 2.2)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const IconEye = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const IconExpand = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
  </svg>
)

export const IconImage = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m3.5 17.5 5-5 4 4 3.5-3.5 4.5 4.5" />
  </svg>
)

export const IconAlert = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 3 2.5 20h19L12 3Z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)
