// ============================================================
// PixVault — the single DevVault instance for this app.
// The Vault URL is the ONLY thing configured here. No credential
// of any kind lives in this file or in the shipped bundle.
// ============================================================
import { DevVaultClient } from './vault';

const VAULT_URL = import.meta.env?.VITE_VAULT_URL || 'https://devvault.justjaydev.workers.dev';

let instance = null;

export function getVault() {
  if (!instance) {
    instance = new DevVaultClient({
      baseUrl: VAULT_URL,
      redirectUri: (typeof location !== 'undefined' ? location.origin + location.pathname + location.search : ''),
      project: 'pixvault',
    });
  }
  return instance;
}

/* called once at app startup: if the Vault just redirected back with
   a code in the URL, exchange it for an in-memory access token.
   This runs on every page (App root), so it works no matter which
   route the redirect lands on. */
export async function initVaultFromRedirect() {
  const vault = getVault();
  const code = DevVaultClient.codeFromLocation();
  if (code) {
    /* exchange with the redirect_uri that was AUTHORIZED, which is this
       URL with the Vault's own response params removed — not whatever
       this singleton happened to capture at construction time. */
    try { await vault.exchangeCode(code, DevVaultClient.redirectUriFromLocation()); } catch { /* surface in the UI */ }
  }
  return vault.isAuthenticated();
}

/* the exchange needs the exact redirect_uri that was authorized. Because
   the Vault redirects to the same URL the button was on, and the code is
   delivered as a query param, the two line up automatically. */
export function exchangeRedirectUri() {
  if (typeof location === 'undefined') return '';
  return location.origin + location.pathname + location.search;
}

export { DevVaultClient };