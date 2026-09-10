import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import VaultLogo from './VaultLogo.jsx'
import { Reveal } from './motion.jsx'

function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <div
        className="orb animate-float-slow"
        style={{ width: '55vmax', height: '55vmax', top: '-18vmax', left: '-12vmax', background: 'radial-gradient(circle, rgba(124,58,237,.22), transparent 65%)' }}
      />
      <div
        className="orb animate-float-slower"
        style={{ width: '48vmax', height: '48vmax', bottom: '-16vmax', right: '-10vmax', background: 'radial-gradient(circle, rgba(34,211,238,.16), transparent 65%)' }}
      />
    </div>
  )
}

function ScrollProgress() {
  const bar = useRef(null)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? window.scrollY / max : 0
        if (bar.current) bar.current.style.transform = `scaleX(${p})`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])
  return <div ref={bar} className="scroll-progress" style={{ transform: 'scaleX(0)' }} />
}

const navLink = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-out-expo ${
    isActive ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
  }`

export default function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <Aurora />
      <div className="grain-overlay" aria-hidden="true" />
      <ScrollProgress />

      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out-expo ${scrolled ? 'glass shadow-lg shadow-black/30' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <VaultLogo size={34} />
            <span className="font-display text-lg font-bold tracking-tight">
              Pix<span className="grad-text">Vault</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={navLink}>Vault</NavLink>
            <NavLink to="/about" className={navLink}>About</NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-24 sm:px-6">{children}</main>

      <footer className="relative border-t border-white/5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vault-violet/60 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Reveal className="flex flex-col items-center gap-6 text-center">
            <Link to="/" className="group flex items-center gap-2.5">
              <VaultLogo size={30} />
              <span className="font-display text-base font-bold">Pix<span className="grad-text">Vault</span></span>
            </Link>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1.5">
              <NavLink to="/" end className={navLink}>Vault</NavLink>
              <NavLink to="/about" className={navLink}>About</NavLink>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500">
              Wallpapers in full quality, always. Original files, zero compression, zero watermarks, zero signup.
            </p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-xs text-slate-600">
              Built by <a className="text-slate-400 underline decoration-vault-violet/50 underline-offset-4 transition-colors hover:text-white" href="https://justjaydev.github.io" target="_blank" rel="noreferrer">JustJayDev</a>
            </p>
          </Reveal>
        </div>
      </footer>
    </div>
  )
}