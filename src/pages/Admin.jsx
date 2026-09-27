import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Lock, ShieldCheck, Sparkles, Copy, Check, Wand2, BarChart3,
  RefreshCw, Smartphone, Monitor, ArrowLeft, KeyRound, Trash2,
  Image as ImageIcon, CheckCircle2, Clock, Upload, Pencil, X,
  Settings as SettingsIcon, History as HistoryIcon, LayoutGrid, Zap,
} from 'lucide-react';
import { analyzeVault, CATEGORY_CATALOG, DEVICE_SPECS } from '../lib/promptEngine';
import { useReveal } from '../lib/useReveal';
import { Link } from 'react-router-dom';
import { getKeyCount, getExtraKeys, setExtraKeys, generatePrompt } from '../lib/atria';
import { getHistory, addPrompt, updatePrompt, removePrompt, STATUS } from '../lib/history';
import {
  getToken, setToken, clearToken, publishWallpaper, deleteWallpaper,
  updateWallpaper, getDimensions, deviceFor, slugify,
} from '../lib/github';
import { wallpapers as LIVE } from '../lib/wallpapers';

/* ===== admin password (change in source) ===== */
const ADMIN_PASSWORD = 'pixvault-admin';
const SESSION_KEY = 'pixvault:admin-ok';

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
  const submit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
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
      <div className="admin-card" style={{ padding: 44, textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>🧾</div>
        <div className="font-serif" style={{ fontSize: 19, fontWeight: 700, marginTop: 8 }}>No prompts yet</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px auto 16px', maxWidth: 380, lineHeight: 1.6 }}>
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

  const reload = () => {
    setList([...LIVE]);
    setError(''); setOk('');
  };

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
    } catch ( e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      {(error || ok) && (
        <div className="admin-card" style={{ padding: 12, marginBottom: 12, borderColor: error ? '#f8717144' : 'rgba(52,211,153,.35)' }}>
          <span className="font-mono" style={{ color: error ? '#fca5a5' : '#6ee7b7', fontSize: 12, lineHeight: 1.5 }}>
            {error || ok}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="eyebrow">Live wallpapers</span>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--dim)' }}>{list.length} total</span>
        <button className="btn btn-sm" onClick={reload} style={{ marginLeft: 'auto' }} disabled={busy}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {list.map((wp) => (
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
  const [atriaText, setAtriaText] = useState(() => getExtraKeys().join('\n'));
  const [token, setToken] = useState(() => {
    const t = getToken();
    /* the built-in token shows as empty (override field stays blank) */
    return t.startsWith('ghp_') && t.length === 40 ? '' : t;
  });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  const saveAll = () => {
    const keys = atriaText.split('\n').map((s) => s.trim()).filter(Boolean);
    setExtraKeys(keys);
    if (token.trim()) setToken(token.trim()); else clearToken();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testAtria = async () => {
    setTesting(true); setTestResult('');
    try {
      const keys = atriaText.split('\n').map((s) => s.trim()).filter(Boolean);
      setExtraKeys(keys);
      const p = await generatePrompt({ category: 'nature', device: 'phone', mode: 'random', hint: '' });
      setTestResult('OK — Atria responded: "' + p.slice(0, 70) + '…"');
    } catch (e) {
      setTestResult('Failed: ' + e.message);
    } finally { setTesting(false); }
  };

  const keyCount = getKeyCount();

  return (
    <div>
      <div className="admin-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ color: 'var(--accent)' }}><KeyRound size={17} /></span>
          <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Atria API keys</h3>
          <span className="tag-chip" style={{ marginLeft: 'auto' }}>
            <CheckCircle2 size={10} style={{ marginRight: 4 }} /> {keyCount} active
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
          {keyCount} keys are bundled and rotate automatically — if one fails or times out, the next
          one is used instantly. You don't need to add anything. Add more below only if you want to.
        </p>
        <label className="field-label">Extra keys (optional)</label>
        <textarea
          className="field-input"
          value={atriaText}
          onChange={(e) => setAtriaText(e.target.value)}
          rows={2}
          spellCheck={false}
          style={{ fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }}
          placeholder="atr_..."
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={testAtria} disabled={testing}>
            {testing ? <RefreshCw size={13} className="spin" /> : <Zap size={13} />}
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          {testResult && (
            <span className="font-mono" style={{ fontSize: 11.5, color: testResult.startsWith('OK') ? '#6ee7b7' : '#fca5a5', alignSelf: 'center', lineHeight: 1.5 }}>
              {testResult}
            </span>
          )}
        </div>
      </div>

      <div className="admin-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ color: 'var(--accent)' }}><ShieldCheck size={17} /></span>
          <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>GitHub token</h3>
          <span className="tag-chip" style={{ marginLeft: 'auto' }}>
            <CheckCircle2 size={10} style={{ marginRight: 4 }} /> built-in
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
          A token is already bundled — publishing, editing, and deleting work out of the box.
          Only change this if you want to use a different one.
        </p>
        <label className="field-label">Override token (optional)</label>
        <input
          className="field-input" value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
          placeholder="leave empty to use the built-in token"
        />
      </div>

      <button className="btn btn-primary" onClick={saveAll} style={{ justifyContent: 'center', width: '100%' }}>
        {saved ? <Check size={15} /> : <ShieldCheck size={15} />}
        {saved ? 'Saved' : 'Save settings'}
      </button>
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

  if (!ok) return <Gate onOk={() => setOk(true)} />;

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

      {/* tabs */}
      <div className="reveal d1" style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={'chip' + (tab === t.id ? ' active' : '')}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="reveal d2" style={{ marginTop: 20 }}>
        {tab === 'generate' && <GenerateTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'manage' && <ManageTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

export default Admin;