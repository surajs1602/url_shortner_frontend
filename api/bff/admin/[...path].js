// ─────────────────────────────────────────────────────────────────────────────
// Admin BFF proxy:  /bff/admin/*  →  ${API_BASE_URL}/admin/*
// Verifies the operator session, then forwards with the server-only x-admin-key.
// The admin key never reaches the browser.
// ─────────────────────────────────────────────────────────────────────────────
import { isAuthed, readBody } from '../_session.js';

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authenticated.' });

  const base     = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const adminKey = process.env.ADMIN_API_KEY;
  if (!base)     return res.status(503).json({ error: 'Backend URL is not configured on the server.' });
  if (!adminKey) return res.status(503).json({ error: 'Admin API is not configured.' });

  // Rebuild the upstream URL: catch-all segments + forward every other query param.
  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const url = new URL(`${base}/admin/${segments.join('/')}`);
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue;
    if (Array.isArray(v)) v.forEach(x => url.searchParams.append(k, x));
    else if (v != null)   url.searchParams.set(k, v);
  }

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
