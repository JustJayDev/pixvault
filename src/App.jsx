import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Link, NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';
import { initVaultFromRedirect } from './lib/vault-instance';

/* --- scroll progress bar --- */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setP(max > 0 ? window.scrollY / max : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 2.5,
        width: '100%',
        zIndex: 60,
        transformOrigin: '0 50%',
        transform: `scaleX(${p})`,
        background: 'linear-gradient(90deg, var(--accent-2), var(--accent), #b45309)',
      }}
      aria-hidden="true"
    />
  );
}

const navCls = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

export default function App() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  /* Exchange a Vault auth code if one just came back in the URL. Runs at
     the App root so it works no matter which route the redirect lands on. */
  useEffect(() => {
    initVaultFromRedirect().catch(() => { /* surfaced in the Settings UI */ });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <ScrollProgress />

      <nav className={'topnav' + (scrolled ? ' scrolled' : '')}>
        <div className="nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Sparkles size={17} color="#1c1206" />
            </span>
            <span className="brand-name">
              Pix<em>Vault</em>
            </span>
          </Link>
          <div className="nav-links">
            <NavLink to="/" end className={navCls}>
              Vault
            </NavLink>
            <NavLink to="/about" className={navCls}>
              About
            </NavLink>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>
            PixVault — wallpapers in full quality, always. Original files, zero
            compression, zero watermarks.
          </span>
          <span>
            Built by{' '}
            <a href="https://justjaydev.github.io" target="_blank" rel="noreferrer">
JustJayDev
            </a>
            {' · '}
            <Link to="/admin" style={{ color: 'var(--dim)' }}>Admin</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}