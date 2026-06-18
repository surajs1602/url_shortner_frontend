import { CFG_STORAGE_KEY, DEFAULT_BASE_URL, DEFAULT_API_KEY, APP_URL } from '../config/index.js';

// Env vars always win — they are the authoritative source.
// localStorage is only used as a fallback when an env var is not set.
export function getCfg() {
  try {
    const stored = JSON.parse(localStorage.getItem(CFG_STORAGE_KEY)) || {};
    return {
      baseUrl: DEFAULT_BASE_URL || stored.baseUrl || '',
      apiKey:  DEFAULT_API_KEY  || stored.apiKey  || '',
    };
  } catch {
    return { baseUrl: DEFAULT_BASE_URL, apiKey: DEFAULT_API_KEY };
  }
}

export function isLive() {
  const c = getCfg();
  return !!(c.baseUrl && c.apiKey);
}

export function getBaseUrl() {
  return getCfg().baseUrl.replace(/\/+$/, '');
}

// Public short link — points straight at the backend, which records the visit,
// runs its safety/health checks, then redirects. This is what we display/copy/share.
export function publicLink(id) {
  return `${getBaseUrl()}/${id}`;
}

// Frontend wake-up route (/go/:id) — kept for old links that still poll cold starts.
export function shortUrl(id) {
  const base = APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/go/${id}`;
}

export function genId(n = 8) {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

export function isValidUrl(u) {
  return typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'));
}

// Hostnames that obviously can't be public destinations — blocked client-side for
// fast feedback only. The backend remains the source of truth.
const PRIVATE_HOST = /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0$|\[?::1\]?$)/i;

/**
 * Lightweight client-side mirror of the server's URL validation.
 * @param {string} raw
 * @param {number} maxLen
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateUrlClient(raw, maxLen = 2048) {
  const u = (raw || '').trim();
  if (!u) return { ok: false, message: 'Paste a URL first.' };
  if (/^(javascript|data|vbscript|file):/i.test(u)) return { ok: false, message: 'That kind of URL isn’t allowed.' };
  if (!isValidUrl(u)) return { ok: false, message: 'URL must start with http:// or https://' };
  if (u.length > maxLen) return { ok: false, message: `URL is too long (max ${maxLen} characters).` };
  try {
    const host = new URL(u).hostname;
    if (PRIVATE_HOST.test(host)) return { ok: false, message: 'Local and private addresses can’t be shortened.' };
  } catch {
    return { ok: false, message: 'That doesn’t look like a valid URL.' };
  }
  return { ok: true };
}

export function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); }
  catch { return u || 'direct'; }
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateTime(ts) {
  const dt = new Date(ts);
  if (isNaN(dt)) return '—';
  return (
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

export function relTime(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export function isExpired(u) {
  return u.expiresAt && new Date(u.expiresAt) < new Date();
}

export function statusOf(u) {
  if (u.isActive === false) return 'disabled';
  if (isExpired(u)) return 'expired';
  return 'active';
}

export function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
