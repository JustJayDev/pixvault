import React, { useRef, useState } from 'react'
import VaultLogo from '../components/VaultLogo.jsx'
import { categories } from '../lib/wallpapers.js'

const REPO = 'JustJayDev/pixvault'
const CATS = categories.filter((c) => c !== 'all')

export default function Admin() {
  const [token, setToken] = useState('')
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATS[0] || 'devotional')
  const [tags, setTags] = useState('')
  const [featured, setFeatured] = useState(false)
  const [dims, setDims] = useState(null)
  const [thumb, setThumb] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)
  const fileRef = useRef(null)

  const gh = (path, opts = {}) =>
    fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })

  const push = async (path, blob, message) => {
    const b64 = await new Promise((res) => {
      const r = new FileReader()
      r.onload = () => res(r.result.split(',')[1])
      r.readAsDataURL(blob)
    })
    const ex = await gh(path)
    const body = { message, content: b64, branch: 'main' }
    if (ex.ok) body.sha = (await ex.json()).sha
    const r = await gh(path, { method: 'PUT', body: JSON.stringify(body) })
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`)
  }

  const readFile = (f) => {
    setFile(f)
    setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
    setDims(null)
    setThumb(null)
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => {
      setDims({ w: img.naturalWidth, h: img.naturalHeight, url })
      const c = document.createElement('canvas')
      const s = Math.min(1, 640 / Math.max(img.width, img.height))
      c.width = Math.round(img.width * s)
      c.height = Math.round(img.height * s)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      c.toBlob((b) => setThumb(b), 'image/webp', 0.8)
    }
    img.src = url
  }

  const upload = async () => {
    if (!token || !file || !dims || !thumb) {
      setMsg('Token + image required')
      return
    }
    setBusy(true)
    setDone(false)
    try {
      setMsg('1/3 · uploading original…')
      const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'wallpaper'
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const fname = `${slug}.${ext}`
      await push(`wallpapers/${fname}`, file, `vault: add ${slug}`)
      setMsg('2/3 · uploading thumbnail…')
      await push(`wallpapers/thumbs/${slug}.webp`, thumb, `vault: thumb ${slug}`)
      setMsg('3/3 · updating catalog…')
      const catRes = await gh('src/data/wallpapers.json?ref=main')
      if (!catRes.ok) throw new Error('cannot read catalog')
      const cj = await catRes.json()
      const catalog = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(cj.content), (c) => c.charCodeAt(0))))
      const entry = {
        id: slug,
        title: title.trim() || slug,
        file: fname,
        width: dims.w,
        height: dims.h,
        size: +(file.size / 1048576).toFixed(1),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        featured,
        added: new Date().toISOString().slice(0, 10),
      }
      const merged = [...catalog.filter((x) => x.id !== entry.id), entry]
      await push('src/data/wallpapers.json', new Blob([JSON.stringify(merged, null, 2)]), `vault: catalog ${slug}`)
      setDone(true)
      setMsg(`🎉 "${entry.title}" is live in the vault!`)
    } catch (e) {
      setMsg(`❌ ${e.message}`)
    }
    setBusy(false)
  }

  const inputCls = 'mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-vault-violet/60'
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-400'

  return (
    <div className="animate-fade-up mx-auto max-w-lg">
      <div className="flex items-center gap-3">
        <VaultLogo size={40} />
        <div>
          <h1 className="font-display text-2xl font-bold">Vaultkeeper</h1>
          <p className="text-xs text-slate-500">Upload panel · Jay only</p>
        </div>
      </div>

      <div className="glass mt-6 space-y-4 rounded-3xl p-5">
        <label className="block">
          <span className={labelCls}>GitHub token</span>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ghp_…" className={inputCls} />
        </label>

        <div>
          <span className={labelCls}>Wallpaper</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-8 transition-colors hover:border-vault-violet/50"
          >
            {file ? (
              <>
                {dims && <img src={dims.url} alt="" className="max-h-36 rounded-lg object-contain" />}
                <p className="text-xs text-slate-400">{file.name} · {dims ? `${dims.w}×${dims.h}` : 'reading…'}</p>
              </>
            ) : (
              <>
                <span className="text-slate-600"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m3.5 17.5 5-5 4 4 3.5-3.5 4.5 4.5"/></svg></span>
                <span className="text-sm text-slate-400">Tap to pick an image</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        </div>

        <label className="block">
          <span className={labelCls}>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Tags (comma)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="neon, night" className={inputCls} />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-violet-500" />
          Feature on home
        </label>

        <button onClick={upload} disabled={busy} className={`btn-primary shine w-full ${busy ? 'opacity-60' : ''}`}>
          {busy ? 'Uploading…' : 'Add to vault'}
        </button>

        {msg && <p className={`text-center text-sm ${done ? 'text-emerald-400' : msg.startsWith('❌') ? 'text-rose-400' : 'text-slate-400'}`}>{msg}</p>}
      </div>
    </div>
  )
}