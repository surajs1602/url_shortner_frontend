// ─────────────────────────────────────────────────────────────────────────────
// Admin BFF proxy:  /api/bff/admin?call=<subpath>  →  ${API_BASE_URL}/admin/<subpath>
// Single fixed-path function (not a catch-all): Vercel resolves single-segment
// routes reliably, whereas [...path] only matched one level here. The admin
// sub-path (with its own querystring) rides along in the `call` param.
// Verifies the operator session, then forwards with the server-only x-admin-key.
// ─────────────────────────────────────────────────────────────────────────────
import { isAuthed, readBody } from './_session.js';

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authenticated.' });

  const base     = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const adminKey = process.env.ADMIN_API_KEY;
  if (!base)     return res.status(503).json({ error: 'Backend URL is not configured on the server.' });
  if (!adminKey) return res.status(503).json({ error: 'Admin API is not configured.' });

  // `call` arrives fully decoded, e.g. "urls/abc/disable" or "urls?domain=x&limit=25".
  const call = (typeof req.query.call === 'string' ? req.query.call : '').replace(/^\/+/, '');
  const url  = `${base}/admin/${call}`;

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
