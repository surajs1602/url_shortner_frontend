// ─────────────────────────────────────────────────────────────────────────────
// Admin service module — every admin endpoint, centralized.
// Calls the BFF (Vercel functions). The browser only sends its session cookie;
// the server-side function injects the x-admin-key.
//
// Admin sub-paths ride in a single `call` query param against the fixed-path
// proxy /api/bff/admin — single-segment routes resolve reliably on Vercel,
// unlike a deep [...path] catch-all (which 404'd past one level).
// ─────────────────────────────────────────────────────────────────────────────
import { normalizeError } from './apiClient.js';

const BFF_BASE = import.meta.env.VITE_BFF_BASE || '/api/bff';

// Lets the auth provider react to an expired/invalid session from anywhere.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) { onUnauthorized = fn || (() => {}); }

async function call(url, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body != null ? { 'Content-Type': 'application/json' } : undefined,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw { status: 0, message: networkErr.message || 'Network error — is the BFF running?', code: 'network' };
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty/non-JSON body */ }

  if (res.status === 401) { onUnauthorized(); throw normalizeError(res, data); }
  if (!res.ok) throw normalizeError(res, data);
  return data;
}

// Forward an admin sub-path (with its own querystring) through the proxy.
function admin(subpath, opts) {
  return call(`${BFF_BASE}/admin?call=${encodeURIComponent(subpath)}`, opts);
}

// Build a querystring from defined, non-empty values only.
function qs(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    u.set(k, v);
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

// ── Auth (single-segment routes — no proxying needed) ──────────────────────────
export const adminAuth = {
  login:   (password) => call(`${BFF_BASE}/login`,  { method: 'POST', body: { password } }),
  logout:  ()         => call(`${BFF_BASE}/logout`, { method: 'POST' }),
  session: ()         => call(`${BFF_BASE}/session`),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminApi = {
  /** @returns {Promise<import('./types.js').UrlDoc[]>} */
  listUrls:    ({ domain, blocked, reachable, limit } = {}) =>
                 admin(`urls${qs({ domain, blocked, reachable, limit })}`),
  /** @returns {Promise<import('./types.js').UrlDoc>} */
  getUrl:      (id) => admin(`urls/${encodeURIComponent(id)}`),
  blockedUrls: () => admin('urls/blocked'),

  disableUrl:  (id, reason) => admin(`urls/${encodeURIComponent(id)}/disable`, { method: 'POST', body: { reason } }),
  enableUrl:   (id)         => admin(`urls/${encodeURIComponent(id)}/enable`,  { method: 'POST' }),
  deleteUrl:   (id)         => admin(`urls/${encodeURIComponent(id)}`,         { method: 'DELETE' }),

  abuseReports: (status) => admin(`abuse-reports${qs({ status })}`),

  bannedIps:  () => admin('banned-ips'),
  banIp:      (ip, reason) => admin('banned-ips', { method: 'POST', body: { ip, reason } }),
  unbanIp:    (ip)         => admin(`banned-ips/${encodeURIComponent(ip)}`, { method: 'DELETE' }),

  healthCheck: (batchSize) => admin('health-check', { method: 'POST', body: { batchSize } }),

  logs: ({ limit, level } = {}) => admin(`logs${qs({ limit, level })}`),
};
