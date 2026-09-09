import React, { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import VaultLogo from './VaultLogo.jsx'

function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <div
        className="orb animate-float-slow"
        style={{
          width: '55vmax',
          height: '55vmax',
          top: '-18vmax',
          left: '-12vmax',
          background: 'radial-gradient(circle, rgba(124,58,237,.22), transparent 65%)',
        }}
      />
      <div
        className="orb animate-float-slower"
        style={{
          width: '48vmax',
          height: '48vmax',
          bottom: '-16vmax',
          right: '-10vmax',
          background: 'radial-gradient(circle, rgba(34,211,238,.16), transparent 65%)',
        }}
      />
    </div>
  )
}

const navLink = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
  }`

export default function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <Aurora />

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <VaultLogo size={34} />
            <span className="font-display text-lg font-bold tracking-tight">
              Pix<span className="grad-text">Vault</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={navLink}>
              Vault
            </NavLink>
            <NavLink to="/about" className={navLink}>
              About
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-24 sm:px-6">{children}</main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <p>
          Pix<span className="grad-text font-semibold">Vault</span> — wallpapers in full quality, always.
        </p>
        <p className="mt-1">
          Built by <a className="text-slate-400 underline decoration-vault-violet/50 underline-offset-4" href="https://justjaydev.github.io" target="_blank" rel="noreferrer">JustJayDev</a>
        </p>
      </footer>
    </div>
  )
}