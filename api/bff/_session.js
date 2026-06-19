// ─────────────────────────────────────────────────────────────────────────────
// Shared session helpers for the admin BFF (files prefixed "_" aren't routed).
// The operator session is a signed, httpOnly cookie — the browser never sees the
// admin key, and can't read or forge the cookie.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'node:crypto';

export const COOKIE_NAME = 'admin_session';
const MAX_AGE_SECS = 8 * 60 * 60; // 8 hours
// vercel dev runs over http://localhost — only mark Secure in real deployments.
const IS_PROD = process.env.NODE_ENV === 'production';

const secret = () => process.env.SESSION_SECRET || '';

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

// token = "<expiryMs>.<hmac>"
export function makeToken() {
  const exp = Date.now() + MAX_AGE_SECS * 1000;
  return `${exp}.${sign(String(exp))}`;
}

export function verifyToken(token) {
  if (!token || !secret()) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const sig    = token.slice(dot + 1);
  const exp    = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(expStr);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function cookieString(value, maxAge) {
  const bits = [`${COOKIE_NAME}=${value}`, 'HttpOnly', 'SameSite=Strict', 'Path=/', `Max-Age=${maxAge}`];
  if (IS_PROD) bits.push('Secure');
  return bits.join('; ');
}

export function setSessionCookie(res, token) { res.setHeader('Set-Cookie', cookieString(token, MAX_AGE_SECS)); }
export function clearSessionCookie(res)       { res.setHeader('Set-Cookie', cookieString('', 0)); }

export function isAuthed(req) {
  return verifyToken(parseCookies(req)[COOKIE_NAME]);
}

// Constant-time string compare that tolerates differing lengths.
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Vercel usually populates req.body, but fall back to reading the stream.
export async function readBody(req) {
  if (req.body != null) {
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
    return req.body;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
