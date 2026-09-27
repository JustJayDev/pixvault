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
      redirectUri: (typeof location !== 'undefined' ? location.origin + location.pathname : ''),
      project: 'pixvault',
    });
  }
  return instance;
}

/* called once at app startup: if the Vault just redirected back with
   a code in the fragment, exchange it for an in-memory access token */
export async function initVaultFromRedirect() {
  const vault = getVault();
  const code = DevVaultClient.codeFromLocation();
  if (code) {
    try { await vault.exchangeCode(code); } catch { /* surface in the UI */ }
  }
  return vault.isAuthenticated();
}

export { DevVaultClient };