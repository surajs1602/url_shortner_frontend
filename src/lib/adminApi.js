// ─────────────────────────────────────────────────────────────────────────────
// Admin service module — every admin endpoint, centralized.
// All calls go through the BFF (/bff/admin/*), which injects the x-admin-key
// server-side. The browser only ever sends its session cookie.
// ─────────────────────────────────────────────────────────────────────────────
import { normalizeError } from './apiClient.js';

const BFF_BASE = import.meta.env.VITE_BFF_BASE || '/bff';

// Lets the auth provider react to an expired/invalid session from anywhere.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) { onUnauthorized = fn || (() => {}); }

async function bff(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BFF_BASE}${path}`, {
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

// ── Auth ────────────────────────────────────────────────────────────────────
export const adminAuth = {
  login:   (password) => bff('/login',  { method: 'POST', body: { password } }),
  logout:  ()         => bff('/logout', { method: 'POST' }),
  session: ()         => bff('/session'),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminApi = {
  /** @returns {Promise<import('./types.js').UrlDoc[]>} */
  listUrls:    ({ domain, blocked, reachable, limit } = {}) =>
                 bff(`/admin/urls${qs({ domain, blocked, reachable, limit })}`),
  /** @returns {Promise<import('./types.js').UrlDoc>} */
  getUrl:      (id) => bff(`/admin/urls/${encodeURIComponent(id)}`),
  blockedUrls: () => bff('/admin/urls/blocked'),

  disableUrl:  (id, reason) => bff(`/admin/urls/${encodeURIComponent(id)}/disable`, { method: 'POST', body: { reason } }),
  enableUrl:   (id)         => bff(`/admin/urls/${encodeURIComponent(id)}/enable`,  { method: 'POST' }),
  deleteUrl:   (id)         => bff(`/admin/urls/${encodeURIComponent(id)}`,         { method: 'DELETE' }),

  abuseReports: (status) => bff(`/admin/abuse-reports${qs({ status })}`),

  bannedIps:  () => bff('/admin/banned-ips'),
  banIp:      (ip, reason) => bff('/admin/banned-ips', { method: 'POST', body: { ip, reason } }),
  unbanIp:    (ip)         => bff(`/admin/banned-ips/${encodeURIComponent(ip)}`, { method: 'DELETE' }),

  healthCheck: (batchSize) => bff('/admin/health-check', { method: 'POST', body: { batchSize } }),

  logs: ({ limit, level } = {}) => bff(`/admin/logs${qs({ limit, level })}`),
};
