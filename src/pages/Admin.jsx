import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Lock, ShieldCheck, Sparkles, Copy, Check, Wand2, BarChart3,
  RefreshCw, Smartphone, Monitor, ArrowLeft, KeyRound, Trash2,
  Image as ImageIcon, CheckCircle2, Clock, Upload, Pencil, X,
  Settings as SettingsIcon, History as HistoryIcon, LayoutGrid, Zap,
  Search, AlertTriangle,
} from 'lucide-react';
import { analyzeVault, CATEGORY_CATALOG, DEVICE_SPECS } from '../lib/promptEngine';
import { useReveal } from '../lib/useReveal';
import { Link } from 'react-router-dom';
import { getKeyCount, getExtraKeys, setExtraKeys, generatePrompt } from '../lib/atria';
import { getHistory, addPrompt, updatePrompt, removePrompt, STATUS } from '../lib/history';
import {
  getToken, setToken, clearToken, publishWallpaper, deleteWallpaper,
  updateWallpaper, getDimensions, deviceFor, slugify, getLiveWallpapers,
} from '../lib/github';
import { getVault, initVaultFromRedirect } from '../lib/vault-instance';
import { wallpapers as LIVE } from '../lib/wallpapers';

/* ===== admin password =====
 * SECURITY: stored as a salted SHA-256 hash, never as plain text. The
 * passphrase itself exists nowhere in the source or the built bundle.
 * Login hashes the input with the same function and compares digests. */
const ADMIN_PASSWORD_HASH =
  'c4d2bbf9e7cf8e139de05074a1addbd3124444c12a9d5d57597252d06759bdd8';
const SESSION_KEY = 'pixvault:admin-ok';

async function digestOf(input) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const TABS = [
  { id: 'generate', label: 'Generate', icon: Wand2 },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'manage', label: 'Wallpapers', icon: LayoutGrid },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

/* ================= small helpers ================= */
function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
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

function StatusPill({ status }) {
  const map = {
    pending:  { label: 'Pending',  color: 'var(--dim)',    icon: Clock },
    ready:    { label: 'Ready',    color: '#fbbf24',       icon: ImageIcon },
    approved: { label: 'Approved', color: '#34d399',       icon: CheckCircle2 },
    published:{ label: 'Live',     color: 'var(--accent)', icon: CheckCircle2 },
  };
  const m = map[status] || map.pending;
  const Icon = m.icon;
  return (
    <span className="tag-chip" style={{ color: m.color, borderColor: m.color + '55', background: m.color + '12' }}>
      <Icon size={10} style={{ marginRight: 4 }} />
      {m.label}
    </span>
  );
}

/* ================= password gate ================= */
function Gate({ onOk }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const guess = await digestOf(pw);
    if (guess === ADMIN_PASSWORD_HASH) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* */ }
      onOk();
    } else { setErr('Wrong password. Try again.'); setPw(''); }
  };
  return (
    <section className="hero" style={{ minHeight: '62vh' }}>
      <div className="hero-glow" aria-hidden="true" />
      <div className="wrap" style={{ maxWidth: 460 }}>
        <form onSubmit={submit} className="admin-card reveal" style={{ padding: 30, marginTop: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <span style={{
              width: 52, height: 52, borderRadius: 15, display: 'grid', placeItems: 'center',
              background: 'var(--accent-dim)', color: 'var(--accent)',
            }}>
              <Lock size={24} />
            </span>
            <div>
              <span className="eyebrow">Restricted</span>
              <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>
                Admin Panel
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              Enter the password to manage prompts, approvals, and wallpapers.
            </p>
          </div>
          <input
            type="password" className="field-input" value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password" autoFocus
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
          <Link to="/" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5,
            marginTop: 16, fontSize: 12, color: 'var(--dim)', textDecoration: 'none',
          }}>
            <ArrowLeft size={13} /> Back to vault
          </Link>
        </form>
      </div>
    </section>
  );
}

/* ================= GENERATE tab ================= */
function GenerateTab() {
  const [category, setCategory] = useState('nature');
  const [device, setDevice] = useState('phone');
  const [mode, setMode] = useState('curated');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const analysis = useMemo(() => analyzeVault(), []);
  const keyCount = getKeyCount();

  const run = async () => {
    setLoading(true); setError(''); setResult('');
    try {
      const prompt = await generatePrompt({ category, device, mode, hint });
      setResult(prompt);
      addPrompt({ prompt, category, device, mode, hint });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="admin-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ color: 'var(--accent)' }}><Wand2 size={17} /></span>
          <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>
            Prompt Generator
          </h3>
          {keyCount ? (
            <span className="tag-chip" style={{ marginLeft: 'auto' }}>
              <CheckCircle2 size={10} style={{ marginRight: 4 }} /> {keyCount} Atria keys rotating
            </span>
          ) : (
            <span className="tag-chip" style={{ marginLeft: 'auto', color: '#f87171', borderColor: '#f8717155', background: '#f8717112' }}>
              no API key
            </span>
          )}
        </div>

        {/* mode */}
        <label className="field-label">Mode</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { k: 'curated', label: 'Curated — fill vault gaps' },
            { k: 'random', label: 'Random — any trending subject' },
          ].map((m) => (
            <button
              key={m.k}
              className={'chip' + (mode === m.k ? ' active' : '')}
              onClick={() => setMode(m.k)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* category + device */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: 170 }}>
            <label className="field-label">Category</label>
            <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_CATALOG.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.label} — {analysis.counts[c.name] || 0} in vault
                </option>
              ))}
            </select>
          </div>
                   <div style={{ flex: '1 1 170px', minWidth: 150 }}>
            <label className="field-label">Device</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.keys(DEVICE_SPECS).map((d) => (
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
        </div>

        {/* hint */}
        <label className="field-label" style={{ marginTop: 14 }}>Extra direction (optional)</label>
        <input
          className="field-input" value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. moody, rain, neon, no people"
        />

        <button
          className="btn btn-primary"
          onClick={run}
          disabled={loading}
          style={{ width: '100%', marginTop: 16, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />}
          {loading ? 'Atria is analyzing your vault…' : 'Generate refined prompt'}
        </button>

        {error && (
          <div className="font-mono" style={{ color: '#f87171', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <span className="font-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dim)' }}>
                Refined prompt — saved to history
              </span>
              <CopyButton text={result} label="Copy prompt" />
            </div>
            <pre className="prompt-box">{result}</pre>
            <p style={{ fontSize: 12, color: 'var(--dim)', margin: '10px 0 0', lineHeight: 1.55 }}>
              Paste this into ChatGPT (GPT-Image-2) → attach the result in the{' '}
              <b style={{ color: 'var(--muted)' }}>History</b> tab → approve to publish.
            </p>
          </div>
        )}
      </div>

      {/* mini vault readout */}
      <div className="admin-card" style={{ padding: 16, marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'var(--accent)' }}><BarChart3 size={16} /></span>
        <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          vault: {analysis.total} · phone {analysis.deviceSplit.phone} · desktop {analysis.deviceSplit.desktop}
        </span>
        <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--dim)' }}>
          Atria sees your {analysis.total} existing wallpapers and will not repeat them
        </span>
      </div>
    </div>
  );
}

/* ================= HISTORY tab ================= */
function HistoryTab() {
  const [history, setHistory] = useState(() => getHistory());
  const [busy, setBusy] = useState({});
  const [error, setError] = useState('');

  const refresh = () => setHistory(getHistory());

  const onAttach = (id, file) => {
    if (!file) return;
    updatePrompt(id, { status: STATUS.READY, fileName: file.name, title: file.name.replace(/\.[^.]+$/, '') });
    refresh();
  };

  const publish = async (id, file) => {
    const item = history.find((p) => p.id === id);
    if (!item || !file) { setError('Attach an image first.'); return; }
    setBusy((b) => ({ ...b, [id]: 'publishing' }));
    setError('');
    try {
      const dims = await getDimensions(file);
      const title = (item.title && item.title.trim()) || slugify(item.prompt.slice(0, 24));
      const entry = {
        id: slugify(title),
        title,
        width: dims.w,
        height: dims.h,
        size: Math.max(0.1, Math.round((file.size / (1024 * 1024)) * 10) / 10),
        category: item.category || 'abstract',
        device: deviceFor(dims.w, dims.h),
        tags: [item.category, 'ai-made', 'gpt-image-2'].filter(Boolean),
        colors: [],
        source: 'ai',
        featured: false,
        added: new Date().toISOString().slice(0, 10),
      };
      await publishWallpaper({ file, entry, commitMsg: `wallpaper: publish "${title}" from prompt` });
      updatePrompt(id, { status: STATUS.PUBLISHED, publishedAt: new Date().toISOString(), title });
      refresh();
    } catch (e) {
      setError(e.message);
      updatePrompt(id, { status: STATUS.READY });
      refresh();
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
    }
  };

  const del = (id) => {
    if (!confirm('Delete this prompt from history?')) return;
    removePrompt(id);
    refresh();
  };

  if (!history.length) {
    return (
      <div className="admin-card admin-empty">
        <span className="glyph"><HistoryIcon size={24} /></span>
        <h3>No prompts yet</h3>
        <p>
          Generate a prompt in the Generate tab and it will land here, waiting for its image.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="admin-card" style={{ padding: 12, marginBottom: 12, borderColor: '#f8717144' }}>
          <span className="font-mono" style={{ color: '#fca5a5', fontSize: 12, lineHeight: 1.5 }}>{error}</span>
        </div>
      )}
      {history.map((p) => (
        <HistoryRow
          key={p.id} p={p} busy={busy[p.id]}
          onAttach={onAttach} publish={publish} del={del}
        />
      ))}
    </div>
  );
}

function HistoryRow({ p, busy, onAttach, publish, del }) {
  const [file, setFile] = useState(null);
  const [open, setOpen] = useState(false);
  const fileInput = useRef(null);

  const canPublish = p.status === STATUS.READY && file;

  return (
    <div className="admin-card" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusPill status={p.status} />
            <span className="tag-chip">{p.category}</span>
            <span className="tag-chip">{p.device}</span>
            <span className="tag-chip">{p.mode}</span>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--dim)' }}>
              {new Date(p.createdAt).toLocaleString()}
            </span>
          </div>
          <p
            className="font-mono"
            onClick={() => setOpen((o) => !o)}
            style={{
              fontSize: 12, color: 'var(--muted)', margin: '9px 0 0', lineHeight: 1.6,
              cursor: 'pointer',
              display: '-webkit-box', WebkitLineClamp: open ? 'none' : 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {p.prompt}
          </p>
          {p.fileName && (
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 7 }}>
              <ImageIcon size={11} style={{ verticalAlign: -1, marginRight: 5 }} />
              {p.fileName}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 'none', justifyContent: 'flex-end' }}>
          <CopyButton text={p.prompt} label="Copy" />
          <button className="btn btn-sm" onClick={() => del(p.id)} disabled={busy}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* attach image + approve & publish */}
      {(p.status === STATUS.PENDING || p.status === STATUS.READY) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            ref={fileInput} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; setFile(f); if (f) onAttach(p.id, f); }}
          />
          <button className="btn btn-sm" onClick={() => fileInput.current?.click()} disabled={busy}>
            <Upload size={13} /> {p.status === STATUS.READY ? 'Replace image' : 'Attach image'}
          </button>
          {file && (
            <button
              className="btn btn-sm btn-primary" disabled={!canPublish || busy}
              onClick={() => publish(p.id, file)}
            >
              {busy === 'publishing' ? <RefreshCw size={13} className="spin" /> : <CheckCircle2 size={13} />}
              {busy === 'publishing' ? 'Publishing…' : 'Approve & publish'}
            </button>
          )}
          {busy && busy !== 'publishing' && (
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--dim)' }}>{busy}…</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= WALLPAPERS (manage) tab ================= */
function ManageTab() {
  const [list, setList] = useState(() => [...LIVE]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const reload = async () => {
    setLoading(true);
    try {
      const live = await getLiveWallpapers();
      if (Array.isArray(live)) setList([...live]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* load the live list once on mount */
  useEffect(() => { reload(); }, []);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = list;
    if (term) {
      out = out.filter((w) =>
        (w.title || '').toLowerCase().includes(term) ||
        (w.category || '').toLowerCase().includes(term) ||
        (w.id || '').toLowerCase().includes(term)
      );
    }
    out = [...out];
    if (sortBy === 'newest') out.sort((a, b) => (a.added || '').localeCompare(b.added || '') * -1);
    if (sortBy === 'oldest') out.sort((a, b) => (a.added || '').localeCompare(b.added || ''));
    if (sortBy === 'title') out.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return out;
  }, [list, q, sortBy]);

  const handleDelete = async (id) => {
    const wp = list.find((w) => w.id === id);
    if (!wp) return;
    if (!confirm(`Delete "${wp.title}"? This removes it from the live site.`)) return;
    setBusy(true); setError(''); setOk('');
    try {
      await deleteWallpaper(id);
      setOk(`Deleted "${wp.title}" — deploying.`);
      reload();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleSave = async (id, patch) => {
    setBusy(true); setError(''); setOk('');
    try {
      await updateWallpaper(id, patch);
      setOk(`Updated "${patch.title || id}".`);
      setEditing(null);
      reload();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      {(error || ok) && (
        <div className={'admin-toast ' + (error ? 'err' : 'ok')}>
          {error ? <AlertTriangle size={14} style={{ flex: 'none', marginTop: 1 }} /> : <CheckCircle2 size={14} style={{ flex: 'none', marginTop: 1 }} />}
          <span>{error || ok}</span>
        </div>
      )}

      <div className="admin-manage-head">
        <span className="eyebrow">Live wallpapers</span>
        <span className="count">{list.length} total</span>
        <div className="searchbar" style={{ flex: '1 1 180px', minWidth: 150, padding: '8px 12px', marginLeft: 'auto' }}>
          <Search size={14} style={{ color: 'var(--dim)', flex: 'none' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter…"
            style={{ fontSize: 13 }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', display: 'flex', padding: 0 }} aria-label="clear">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          className="field-input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ flex: 'none', width: 'auto', padding: '8px 30px 8px 12px', fontSize: 12.5 }}
          aria-label="sort"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title A–Z</option>
        </select>
        <button className="btn btn-sm" onClick={reload} disabled={busy}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && [0, 1, 2, 3].map((i) => <div key={i} className="admin-skel" />)}

      {!loading && visible.length === 0 && (
        <div className="admin-card admin-empty">
          <span className="glyph"><ImageIcon size={24} /></span>
          <h3>{list.length ? 'No matches' : 'No wallpapers yet'}</h3>
          <p>
            {list.length
              ? `Nothing matches "${q}". Try a different search.`
              : 'Publish one from the History tab and it will show up here.'}
          </p>
        </div>
      )}

      {!loading && visible.map((wp) => (
        <ManageRow
          key={wp.id} wp={wp} busy={busy} editing={editing === wp.id}
          onEdit={() => setEditing(wp.id)} onCancel={() => setEditing(null)}
          onDelete={() => handleDelete(wp.id)} onSave={(patch) => handleSave(wp.id, patch)}
        />
      ))}
    </div>
  );
}

function ManageRow({ wp, busy, editing, onEdit, onCancel, onDelete, onSave }) {
  const [title, setTitle] = useState(wp.title);
  const [category, setCategory] = useState(wp.category);
  const [featured, setFeatured] = useState(!!wp.featured);
  const BASE = import.meta.env.BASE_URL || '/pixvault/';

  if (editing) {
    return (
      <div className="admin-card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 200px', minWidth: 160 }}>
            <label className="field-label">Title</label>
            <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 140px', minWidth: 130 }}>
            <label className="field-label">Category</label>
            <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_CATALOG.map((c) => <option key={c.name} value={c.name}>{c.label}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--muted)', paddingBottom: 10 }}>
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-primary" onClick={() => onSave({ title, category, featured })} disabled={busy}>
              <Check size={13} /> Save
            </button>
            <button className="btn btn-sm" onClick={onCancel} disabled={busy}>
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card" style={{ padding: 12, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
      <img
        src={`${BASE}wallpapers/${wp.thumb}`}
        alt={wp.title}
        style={{ width: 52, height: 72, objectFit: 'cover', borderRadius: 8, flex: 'none', background: '#1c1917' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="font-serif" style={{ fontWeight: 700, fontSize: 15 }}>{wp.title}</span>
          {wp.featured && <span className="tag-chip">featured</span>}
          <span className="tag-chip">{wp.category}</span>
          <span className="tag-chip">{wp.device}</span>
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4 }}>
          {wp.width}×{wp.height} · {wp.id}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
        <button className="btn btn-sm" onClick={onEdit} disabled={busy}>
          <Pencil size={13} /> Edit
        </button>
        <button className="btn btn-sm" onClick={onDelete} disabled={busy}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

/* ================= SETTINGS tab ================= */
function SettingsTab() {
  const [vaultConnected, setVaultConnected] = useState(() => getVault().isAuthenticated());
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState('');

  const connect = () => {
    /* sends the admin to the Vault; it redirects back with a code in
       the URL fragment, which initVaultFromRedirect() exchanges */
    window.location.href = getVault().authorizeUrl();
  };
  const disconnect = () => {
    getVault().logout();
    setVaultConnected(false);
    setTestResult('');
  };
  const testAtria = async () => {
    setBusy(true); setTestResult('');
    try {
      const p = await generatePrompt({ category: 'nature', device: 'phone', mode: 'random', hint: '' });
      setTestResult('OK — Atria responded: "' + p.slice(0, 70) + '…"');
    } catch (e) {
      setTestResult('Failed: ' + e.message);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="admin-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ color: 'var(--accent)' }}><ShieldCheck size={17} /></span>
          <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Developer Vault</h3>
          <span className="tag-chip" style={{ marginLeft: 'auto' }}>
            {vaultConnected
              ? <><CheckCircle2 size={10} style={{ marginRight: 4 }} /> connected</>
              : <><AlertTriangle size={10} style={{ marginRight: 4 }} /> not connected</>}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
          The GitHub token and Atria keys now live in the Developer Vault — a server-side
          secret store. They are never shipped in this bundle and never touch your browser.
          Publishing and prompt generation only work while a Vault session is connected.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {vaultConnected ? (
            <>
              <button className="btn btn-sm" onClick={testAtria} disabled={busy}>
                {busy ? <RefreshCw size={13} className="spin" /> : <Zap size={13} />}
                {busy ? 'Testing…' : 'Test Atria connection'}
              </button>
              <button className="btn btn-sm" onClick={disconnect}>Disconnect</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={connect}>
              <ShieldCheck size={13} /> Connect the Vault
            </button>
          )}
        </div>
        {testResult && (
          <div className="font-mono" style={{ fontSize: 11.5, color: testResult.startsWith('OK') ? '#6ee7b7' : '#fca5a5', marginTop: 10, lineHeight: 1.5 }}>
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= page shell ================= */
const Admin = () => {
  useReveal();
  const [ok, setOk] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
});
  const [tab, setTab] = useState('generate');
  const [liveCount, setLiveCount] = useState(null);

  /* if the Vault just redirected back with an auth code in the URL
     fragment, exchange it now for an in-memory access token */
  useEffect(() => {
    initVaultFromRedirect().catch(() => { /* surfaced in Settings */ });
  }, []);

  /* fetch the live wallpaper count for the sidebar stat */
  useEffect(() => {
    if (!ok) return;
    getLiveWallpapers()
      .then((l) => { if (Array.isArray(l)) setLiveCount(l.length); })
      .catch(() => {});
  }, [ok]);

  if (!ok) return <Gate onOk={() => setOk(true)} />;

  const pending = getHistory().filter((p) => p.status === STATUS.PENDING).length;
  const ready = getHistory().filter((p) => p.status === STATUS.READY).length;

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 44 }}>
      <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Prompt engine · approvals · publishing</span>
          <h1 className="font-serif" style={{ fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 700, margin: '8px 0 0', letterSpacing: '-.02em' }}>
            Admin <span className="text-gradient">Panel</span>
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '8px 0 0', maxWidth: 560, lineHeight: 1.6 }}>
            Generate refined prompts with Atria, attach the image you make, approve it, and it publishes itself.
          </p>
        </div>
        <Link to="/" className="btn btn-sm">
          <ArrowLeft size={13} /> Back to vault
        </Link>
      </div>

      <div className="admin-layout">
        {/* ---------- sidebar ---------- */}
        <aside className="admin-sidebar">
          <div className="admin-side-card">
            <div className="eyebrow" style={{ fontSize: 9.5 }}>navigation</div>
            <nav className="admin-nav">
              {TABS.map((t) => {
                const Icon = t.icon;
                const badge =
                  t.id === 'history' ? pending + ready
                  : t.id === 'manage' ? (liveCount != null ? liveCount : null)
                  : null;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={'admin-nav-item' + (tab === t.id ? ' active' : '')}
                  >
                    <Icon size={15} />
                    <span>{t.label}</span>
                    {badge != null && badge > 0 && (
                      <span className="admin-nav-badge">{badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="admin-side-card">
            <div className="eyebrow" style={{ fontSize: 9.5 }}>status</div>
            <div className="admin-stat-row">
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>Live wallpapers</span>
              <span className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                {liveCount != null ? liveCount : '…'}
              </span>
            </div>
            <div className="admin-stat-row">
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>Awaiting image</span>
              <span className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>{pending}</span>
            </div>
            <div className="admin-stat-row">
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>Ready to publish</span>
              <span className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>{ready}</span>
            </div>
            <div className="admin-stat-row" style={{ borderBottom: 0 }}>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>Atria keys</span>
              <span className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>{getKeyCount()}</span>
            </div>
          </div>
        </aside>

        {/* ---------- content ---------- */}
        <div className="admin-content">
          {tab === 'generate' && <GenerateTab />}
          {tab === 'history' && <HistoryTab />}
          {tab === 'manage' && <ManageTab />}
          {tab === 'manage' && (
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--dim)', margin: '12px 2px 0' }}>
              &gt; changes commit to the repository and go live when the site finishes deploying
            </p>
          )}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default Admin;