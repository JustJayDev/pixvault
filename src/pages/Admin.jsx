import React, { useState, useMemo, useCallback } from 'react';
import {
  Lock, ShieldCheck, Sparkles, Copy, Check, Wand2, BarChart3,
  RefreshCw, ChevronRight, Smartphone, Monitor, ArrowLeft,
} from 'lucide-react';
import {
  analyzeVault, suggestNext, buildPrompt, promptForSuggestion,
  CATEGORY_CATALOG, DEVICE_SPECS,
} from '../lib/promptEngine';
import { useReveal } from '../lib/useReveal';
import { Link } from 'react-router-dom';

/* The admin gate. Change this to your own password. */
const ADMIN_PASSWORD = 'pixvault-admin';

const SESSION_KEY = 'pixvault:admin-ok';

function useAdminGate() {
  const [ok, setOk] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
  });
  const [err, setErr] = useState('');
  const [pw, setPw] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setOk(true);
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* */ }
    } else {
      setErr('Wrong password. Try again.');
      setPw('');
    }
  };
  return { ok, err, pw, setPw, submit };
}

/* ---------- small UI helpers ---------- */
function StatCard({ icon, label, value, sub }) {
  return (
    <div className="admin-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span className="font-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          {label}
        </span>
      </div>
      <div className="font-serif" style={{ fontSize: 30, fontWeight: 700, marginTop: 6, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CopyButton({ text, label = 'Copy prompt' }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [text]);
  return (
    <button className={'btn btn-sm' + (copied ? ' btn-primary' : '')} onClick={copy} style={{ flex: 'none' }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/* ---------- one suggestion card with its generated prompt ---------- */
function SuggestionCard({ s, index }) {
  const [prompt, setPrompt] = useState(() => promptForSuggestion(s));
  const [device, setDevice] = useState(s.device);
  const [palette, setPalette] = useState(s.palette);
  const [subject, setSubject] = useState(s.subject);
  const [showFull, setShowFull] = useState(false);

  const regen = () => {
    setPrompt(buildPrompt({ category: s.category, device, subject, palette, template: s.template }));
  };

  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span
            className="font-mono"
            style={{
              flex: 'none', width: 24, height: 24, borderRadius: 7,
              background: 'var(--accent-dim)', color: 'var(--accent)',
              display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
            }}
          >
            {index + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="font-serif" style={{ fontSize: 17, fontWeight: 700 }}>
                {s.label}
              </span>
              <span className="tag-chip">{s.category}</span>
              <span className="tag-chip">{device === 'desktop' ? 'desktop' : 'phone'}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
              {s.reason}
            </p>
          </div>
        </div>

        {/* subject input */}
        <label className="field-label" style={{ marginTop: 14 }}>Subject</label>
        <input
          className="field-input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. lone astronaut adrift above a ringed planet"
        />

        {/* device + palette controls */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px', minWidth: 140 }}>
            <label className="field-label">Device</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(Object.keys(DEVICE_SPECS)).map((d) => (
                <button
                  key={d}
                  className={'chip' + (device === d ? ' active' : '')}
                  onClick={() => setDevice(d)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {d === 'phone' ? <Smartphone size={12} /> : <Monitor size={12} />}
                  {DEVICE_SPECS[d].label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: '2 1 220px', minWidth: 180 }}>
            <label className="field-label">Palette</label>
            <select
              className="field-input"
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
            >
              {CATEGORY_CATALOG.find((c) => c.name === s.category)?.palettes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* generated prompt */}
      <div style={{ padding: '14px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <span className="font-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dim)' }}>
            GPT-Image-2 prompt
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm" onClick={regen} style={{ flex: 'none' }}>
              <RefreshCw size={13} /> Rebuild
            </button>
            <CopyButton text={prompt} />
          </div>
        </div>
        <pre
          className="prompt-box"
          onClick={() => setShowFull((o) => !o)}
          style={{ maxHeight: showFull ? 'none' : 132, cursor: 'pointer' }}
          title="click to expand"
        >
{prompt}
        </pre>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            onClick={() => setShowFull((o) => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'var(--dim)', fontSize: 11.5, fontFamily: 'var(--mono)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {showFull ? 'collapse' : 'expand'} <ChevronRight size={12} style={{ transform: showFull ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- the page ---------- */
const Admin = () => {
  useReveal();
  const { ok, err, pw, setPw, submit } = useAdminGate();
  const analysis = useMemo(() => analyzeVault(), []);
  const [suggestions, setSuggestions] = useState(() => suggestNext(6));

  const refresh = () => setSuggestions(suggestNext(6));

  if (!ok) {
    return (
      <section className="hero" style={{ minHeight: '62vh' }}>
        <div className="hero-glow" aria-hidden="true" />
        <div className="wrap" style={{ maxWidth: 460 }}>
          <form onSubmit={submit} className="admin-card reveal" style={{ padding: 30, marginTop: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <span
                style={{
                  width: 52, height: 52, borderRadius: 15, display: 'grid', placeItems: 'center',
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                }}
              >
                <Lock size={24} />
              </span>
              <div>
                <span className="eyebrow">Restricted</span>
                <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>
                  Admin Panel
                </h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                Enter the password to access the prompt generator and vault analysis.
              </p>
            </div>

            <input
              type="password"
              className="field-input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{ marginTop: 20, textAlign: 'center', letterSpacing: '.2em' }}
            />
            {err && (
              <div className="font-mono" style={{ color: '#f87171', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                {err}
              </div>
            )}
            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
              <ShieldCheck size={15} /> Unlock
            </button>
            <Link
              to="/"
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5,
                marginTop: 16, fontSize: 12, color: 'var(--dim)', textDecoration: 'none',
              }}
            >
              <ArrowLeft size={13} /> Back to vault
            </Link>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 44 }}>
      {/* header */}
      <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Prompt Engine · GPT-Image-2</span>
          <h1 className="font-serif" style={{ fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 700, margin: '8px 0 0', letterSpacing: '-.02em' }}>
            Admin <span className="text-gradient">Panel</span>
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '8px 0 0', maxWidth: 560, lineHeight: 1.6 }}>
            Reads your current vault, finds what's missing, and builds ready-to-paste
            GPT-Image-2 prompts — only fresh ideas, nothing you already have.
          </p>
        </div>
        <button className="btn btn-primary" onClick={refresh}>
          <Wand2 size={15} /> New suggestions
        </button>
      </div>

      {/* vault analysis */}
      <div className="reveal d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 26 }}>
        <StatCard icon={<Sparkles size={15} />} label="In vault" value={analysis.total} sub="wallpapers total" />
        <StatCard icon={<BarChart3 size={15} />} label="Categories" value={Object.keys(analysis.counts).length} sub={`of ${CATEGORY_CATALOG.length} possible`} />
        <StatCard icon={<Smartphone size={15} />} label="Phone" value={analysis.deviceSplit.phone} sub="9:16 wallpapers" />
        <StatCard icon={<Monitor size={15} />} label="Desktop" value={analysis.deviceSplit.desktop} sub="16:9 wallpapers" />
      </div>

      {/* gap strip */}
      <div className="reveal d2 admin-card" style={{ marginTop: 12, padding: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="font-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dim)', flex: 'none' }}>
          Empty
        </span>
        {analysis.gaps.filter((g) => g.count === 0).map((g) => (
          <span key={g.name} className="tag-chip" style={{ textTransform: 'capitalize' }}>{g.label}</span>
        ))}
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          — these get suggested first
        </span>
      </div>

      <hr className="rule" style={{ margin: '26px 0' }} />

      {/* suggestions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="eyebrow">Suggested next</span>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--dim)' }}>
          {suggestions.length} prompts · nothing duplicated from your vault
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 16 }}>
        {suggestions.map((s, i) => (
          <SuggestionCard key={`${s.category}-${s.subject}-${i}`} s={s} index={i} />
        ))}
      </div>

      <div
        className="admin-card reveal"
        style={{ marginTop: 22, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <span style={{ color: 'var(--accent)' }}><Sparkles size={16} /></span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', flex: 1, minWidth: 220, lineHeight: 1.55 }}>
          Copy a prompt → paste into ChatGPT (GPT-Image-2) → send me the generated
          image and I'll add it to the vault with thumbnail and metadata.
        </span>
        <Link to="/" className="btn btn-sm" style={{ flex: 'none' }}>
          <ArrowLeft size={13} /> Back to vault
        </Link>
      </div>
    </div>
  );
};

export default Admin;