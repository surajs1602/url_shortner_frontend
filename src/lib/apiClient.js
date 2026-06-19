// ─────────────────────────────────────────────────────────────────────────────
// Typed fetch wrapper — injects headers, parses JSON, normalizes errors.
// All public API calls flow through here so error shapes are consistent.
// ─────────────────────────────────────────────────────────────────────────────
import { getBaseUrl, getCfg } from './helpers.js';

/**
 * Normalized error thrown by every request in this module.
 * @typedef {Object} ApiError
 * @property {number} status               HTTP status (0 = network failure)
 * @property {string} message              Human-readable message for the UI
 * @property {string|null} code            Machine code (blockReason/error/err)
 * @property {number} [retryAfterSeconds]  Present on 429 responses
 * @property {string[]} [chain]            Resolved redirect chain (some 400s)
 * @property {string[]} [sources]          Safety-scan sources (some 400s)
 * @property {*} [data]                    Raw parsed response body
 */

// Default messages for statuses the server doesn't describe itself.
function defaultMessage(status) {
  if (status === 401) return 'Unauthorized — check your API key.';
  if (status === 403) return 'This action is not allowed.';
  if (status === 404) return 'Not found.';
  if (status === 409) return 'That value is already taken.';
  if (status === 429) return 'Too many requests — please slow down.';
  if (status === 503) return 'Service unavailable.';
  return `Request failed (${status}).`;
}

/**
 * Turn a non-OK response + parsed body into a normalized ApiError.
 * `code` prefers the structured blockReason, then any error/err code field.
 * @param {{status?: number}} res
 * @param {*} data
 * @returns {ApiError}
 */
export function normalizeError(res, data) {
  const status  = res && typeof res.status === 'number' ? res.status : 0;
  const code    = (data && (data.blockReason || data.code)) || null;
  const message = (data && (data.err || data.error || data.message)) || defaultMessage(status);
  /** @type {ApiError} */
  const err = { status, message, code, data: data ?? null };
  if (data && data.retryAfterSeconds != null) err.retryAfterSeconds = Number(data.retryAfterSeconds);
  if (data && Array.isArray(data.chain))   err.chain = data.chain;
  if (data && Array.isArray(data.sources)) err.sources = data.sources;
  return err;
}

/**
 * Low-level request. Resolves with parsed JSON, or throws an ApiError.
 * @param {string} url   Absolute URL
 * @param {{ method?: string, headers?: Record<string,string>, body?: *, signal?: AbortSignal }} [opts]
 */
export async function request(url, opts = {}) {
  let res;
  try {
    res = await fetch(url, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (networkErr) {
    // Only a thrown fetch means the network/host is unreachable.
    throw /** @type {ApiError} */ ({
      status: 0,
      message: networkErr.message || 'Network error — is the service reachable?',
      code: 'network',
    });
  }

  let data = null;
  // Some endpoints (or HTML error pages) return non-JSON — don't let that mask the status.
  try { data = await res.json(); } catch (e) { console.warn('[ShortIt] Non-JSON response body:', e.message); }

  if (!res.ok) throw normalizeError(res, data);
  return data;
}

/**
 * Public API call — injects base URL + x-api-key header.
 * @param {string} path Path beginning with "/"
 * @param {{ method?: string, headers?: Record<string,string>, body?: *, signal?: AbortSignal }} [opts]
 */
export function publicFetch(path, opts = {}) {
  const { apiKey } = getCfg();
  return request(getBaseUrl() + path, {
    ...opts,
    headers: { 'x-api-key': apiKey || '', ...(opts.headers || {}) },
  });
}

/**
 * Unauthenticated public call (e.g. abuse reports) — no x-api-key.
 * @param {string} path
 * @param {{ method?: string, headers?: Record<string,string>, body?: *, signal?: AbortSignal }} [opts]
 */
export function openFetch(path, opts = {}) {
  return request(getBaseUrl() + path, opts);
}
