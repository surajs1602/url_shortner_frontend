import {
  API_URL_PATH,
  API_ANALYTICS_PATH,
  HEALTH_PATH,
  MOCK_STORAGE_KEY,
} from '../config/index.js';
import { getCfg, isLive, getBaseUrl, genId, isValidUrl, wait } from './helpers.js';

// ─── API fetch ───────────────────────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const c = getCfg();
  const base = getBaseUrl();
  const res = await fetch(base + path, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': c.apiKey || '',
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg =
      res.status === 429
        ? 'Rate limit hit — try again in a few minutes'
        : res.status === 401
          ? 'Invalid API key — check your Settings'
          : (data && (data.err || data.error || data.message)) || `Request failed (${res.status})`;
    throw { status: res.status, message: msg, data };
  }
  return data;
}

// ─── Demo store ──────────────────────────────────────────────────────────────

function seedMock() {
  const now = Date.now();
  const day = 86400000;
  const agents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome',
    'Mozilla/5.0 (Windows NT 10.0) Chrome',
    'Mozilla/5.0 (Linux; Android 14) Chrome',
  ];
  const refs = [
    'https://twitter.com',
    'https://www.google.com',
    'https://news.ycombinator.com',
    '',
    'https://www.linkedin.com',
  ];

  const visits = (counts) => {
    const h = [];
    counts.forEach((c, di) => {
      for (let i = 0; i < c; i++) {
        h.push({
          timestamp: now - (counts.length - 1 - di) * day - Math.floor(Math.random() * day),
          ip: `102.4.${10 + di}.${1 + i}`,
          userAgent: agents[Math.floor(Math.random() * agents.length)],
          referrer: refs[Math.floor(Math.random() * refs.length)],
        });
      }
    });
    return h.sort((a, b) => a.timestamp - b.timestamp);
  };

  return [
    {
      _id: '1', shortId: 'launch',
      redirectUrl: 'https://shortit.io/blog/were-launching-the-friendliest-url-shortener-2026',
      visitHistory: visits([2, 5, 8, 4, 11, 14, 9]),
      isActive: true,
      expiresAt: new Date(now + 27 * day).toISOString(),
      createdAt: new Date(now - 7 * day).toISOString(),
    },
    {
      _id: '2', shortId: 'gh7Xk2Qp',
      redirectUrl: 'https://github.com/some-org/some-really-long-repository-name/pull/482',
      visitHistory: visits([0, 1, 3, 2, 0, 4, 6]),
      isActive: true,
      expiresAt: null,
      createdAt: new Date(now - 5 * day).toISOString(),
    },
    {
      _id: '3', shortId: 'sale',
      redirectUrl: 'https://store.example.com/black-friday-2026/everything-must-go?ref=email',
      visitHistory: visits([12, 22, 31, 18, 9, 5, 2]),
      isActive: true,
      expiresAt: new Date(now - 1 * day).toISOString(),
      createdAt: new Date(now - 14 * day).toISOString(),
    },
    {
      _id: '4', shortId: 'deck',
      redirectUrl: 'https://docs.google.com/presentation/d/1a2b3c4d5e6f7g8h9i0j/edit',
      visitHistory: visits([1, 0, 2, 1, 3, 1, 0]),
      isActive: true,
      expiresAt: null,
      createdAt: new Date(now - 3 * day).toISOString(),
    },
  ];
}

function mockAll() {
  try {
    const v = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY));
    if (v) return v;
  } catch {}
  const s = seedMock();
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(s));
  return s;
}

function mockSave(arr) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(arr));
}

// ─── Unified Store ────────────────────────────────────────────────────────────

export const Store = {
  isLive,

  async list() {
    if (isLive()) return await apiFetch(API_URL_PATH);
    await wait(280);
    return [...mockAll()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create({ url, slug, expiresAt }) {
    if (!isValidUrl(url)) throw { status: 400, message: 'URL must start with http:// or https://' };
    if (isLive()) {
      const body = { url };
      if (slug) body.slug = slug;
      if (expiresAt) body.expiresAt = expiresAt;
      return await apiFetch(API_URL_PATH, { method: 'POST', body });
    }
    await wait(420);
    const all = mockAll();
    const id = slug || genId(8);
    if (slug && all.some(u => u.shortId === slug)) {
      throw { status: 409, message: 'This slug is already taken' };
    }
    const doc = {
      _id: genId(12),
      shortId: id,
      redirectUrl: url,
      visitHistory: [],
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    all.push(doc);
    mockSave(all);
    return { status: 'Success', shortId: id };
  },

  async analytics(id) {
    if (isLive()) return await apiFetch(`${API_ANALYTICS_PATH}/${encodeURIComponent(id)}`);
    await wait(260);
    const u = mockAll().find(x => x.shortId === id);
    if (!u) throw { status: 404, message: 'URL not found' };
    return {
      id: u.shortId,
      url: u.redirectUrl,
      isActive: u.isActive,
      expiresAt: u.expiresAt,
      invoked: u.visitHistory.length,
      history: u.visitHistory,
    };
  },

  async remove(id) {
    if (isLive()) return await apiFetch(`${API_URL_PATH}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await wait(240);
    const all = mockAll().filter(x => x.shortId !== id);
    mockSave(all);
    return { status: 'Success', message: 'URL deleted' };
  },

  async health() {
    const base = getBaseUrl();
    if (!base) throw { status: 0, message: 'No base URL configured' };
    let res;
    try {
      res = await fetch(base + HEALTH_PATH);
    } catch (networkErr) {
      console.error('[ShortIt] Health check network error:', networkErr, '— URL:', base + HEALTH_PATH);
      throw { status: undefined, message: networkErr.message || 'Network error' };
    }
    if (!res.ok) {
      console.error('[ShortIt] Health check failed:', res.status, base + HEALTH_PATH);
      throw { status: res.status, message: `Health check failed (${res.status})` };
    }
    return await res.json();
  },

  resetDemo() {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  },
};
