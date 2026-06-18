// ─────────────────────────────────────────────────────────────────────────────
// Admin BFF proxy:  /bff/admin/*  →  ${API_BASE_URL}/admin/*
// Verifies the operator session, then forwards with the server-only x-admin-key.
// The admin key never reaches the browser.
// ─────────────────────────────────────────────────────────────────────────────
import { isAuthed, readBody } from '../_session.js';

// Everything after ".../bff/admin" — the leading "/" and querystring are kept
// verbatim. Falls back to the catch-all param if the anchor isn't present.
function upstreamTail(req) {
  const raw = req.url || '';
  const i = raw.indexOf('bff/admin');
  if (i >= 0) return raw.slice(i + 'bff/admin'.length);

  const segs = Array.isArray(req.query.path) ? req.query.path : (req.query.path ? [req.query.path] : []);
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue;
    if (Array.isArray(v)) v.forEach(x => q.append(k, x));
    else if (v != null)   q.set(k, v);
  }
  const qs = q.toString();
  return `/${segs.join('/')}${qs ? `?${qs}` : ''}`;
}

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authenticated.' });

  const base     = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const adminKey = process.env.ADMIN_API_KEY;
  if (!base)     return res.status(503).json({ error: 'Backend URL is not configured on the server.' });
  if (!adminKey) return res.status(503).json({ error: 'Admin API is not configured.' });

  // Derive the sub-path (and querystring) straight from the request URL. Anchoring
  // on "bff/admin" is deterministic — unlike req.query.path, which the rewrite's
  // own :proxyPath capture can pollute and turn /admin/urls into /admin/urls/:id.
  const tail = upstreamTail(req);
  const url  = `${base}/admin${tail}`;

  const init = { method: req.method, headers: { 'x-admin-key': adminKey } };
  if (!['GET', 'HEAD'].includes(req.method)) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(await readBody(req));
  }

  try {
    const upstream = await fetch(url, init);
    const text     = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream request failed.', detail: e.message });
  }
}
