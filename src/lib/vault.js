// ============================================================
// PixVault — DevVault client SDK.
// ------------------------------------------------------------
// REPLACES the old bundled-token github.js + atria.js clients.
//
// What changed and why:
//   * No credential is ever shipped in the bundle. There is no
//     BUILT_IN_TOKEN and no BUILT_IN_KEYS anywhere in this file.
//   * Nothing credential-shaped is written to localStorage. The
//     access token lives in JS memory only and expires in 1 hour.
//   * The browser talks to the Vault; the Vault holds the real
//     GitHub PAT and Atria keys and applies PixVault's policy
//     (repo JustJayDev/pixvault, path allow-list) server-side.
//
// Authorization flow (run once per session, from the admin panel):
//   window.location = vault.authorizeUrl()
//   -> admin approves in the Vault UI
//   -> redirect back with #dv_code=...
//   -> vault.exchangeCode(code) -> in-memory access token
// ============================================================

const DEFAULT_VAULT = 'https://devvault.justjaydev.workers.dev';

class DevVaultClient {
  constructor({ baseUrl = DEFAULT_VAULT, redirectUri = (typeof location !== 'undefined' ? location.origin + location.pathname : ''), project = 'pixvault' } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.redirectUri = redirectUri;
    this.project = project;
    this._token = null;          /* in-memory only, never persisted */
    this._expiresAt = 0;
  }

  /* ---------- authorization ---------- */
  authorizeUrl(scopes = ['github:contents', 'atria:chat']) {
    const u = new URL(this.baseUrl + '/api/oauth/authorize');
    u.searchParams.set('project', this.project);
    u.searchParams.set('redirect_uri', this.redirectUri);
    u.searchParams.set('scopes', scopes.join(','));
    return u.toString();
  }

  /* the code comes back in the URL fragment (never sent to a server) */
  static codeFromLocation(loc = (typeof location !== 'undefined' ? location : null)) {
    if (!loc || !loc.hash) return null;
    const m = /dv_code=([^&]+)/.exec(loc.hash);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async exchangeCode(code, redirectUri = this.redirectUri) {
    const r = await fetch(this.baseUrl + '/api/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Vault token exchange failed (HTTP ${r.status})`);
    this._token = j.access_token;
    this._expiresAt = Date.now() + (j.expires_in || 3600) * 1000;
    /* scrub the code from the URL so it can't be read from history */
    if (typeof history !== 'undefined' && history.replaceState) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch { /* */ }
    }
    return j;
  }

  isAuthenticated() {
    return !!this._token && Date.now() < this._expiresAt;
  }
  logout() {
    this._token = null;
    this._expiresAt = 0;
  }

  /* ---------- transport ---------- */
  async _call(path, body) {
    if (!this.isAuthenticated()) throw new Error('Not authorized with the Vault. Open Settings → Connect Vault.');
    const r = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this._token}`,
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let j = null;
    try { j = JSON.parse(text); } catch { j = { raw: text }; }
    if (!r.ok) throw new Error(j.error || j.raw || `HTTP ${r.status}`);
    return j;
  }

  /* ---------- GitHub Contents (proxied, policy-enforced) ---------- */
  async getFile(path) {
    return this._call('/api/proxy/github/contents', { method: 'GET', path });
  }
  async putFile(path, content, message) {
    return this._call('/api/proxy/github/contents', { method: 'PUT', path, body: { content, message } });
  }
  async deleteFile(path, message) {
    return this._call('/api/proxy/github/contents', { method: 'DELETE', path, body: { message } });
  }

  /* ---------- Atria (proxied, keys never exposed) ---------- */
  async chat(messages, model) {
    const r = await this._call('/api/proxy/atria/chat', { messages, model });
    return r.text;
  }
}

/* module + global for the browser */
export { DevVaultClient };
if (typeof window !== 'undefined') window.DevVaultClient = DevVaultClient;