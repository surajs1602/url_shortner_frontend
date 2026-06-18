import { describe, it, expect, vi, afterEach } from 'vitest';
import { normalizeError, request } from './apiClient.js';

// Build a minimal Response-like object for the fetch mock.
const resLike = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    if (body === undefined) throw new Error('no body');
    return body;
  },
});

afterEach(() => { vi.restoreAllMocks(); });

describe('normalizeError', () => {
  it('prefers blockReason as the machine code and err as the message', () => {
    const e = normalizeError({ status: 400 }, { err: 'Blocked', blockReason: 'malicious' });
    expect(e).toMatchObject({ status: 400, message: 'Blocked', code: 'malicious' });
  });

  it('falls back error → err → message for the message field', () => {
    expect(normalizeError({ status: 409 }, { error: 'taken' }).message).toBe('taken');
    expect(normalizeError({ status: 400 }, { message: 'bad' }).message).toBe('bad');
  });

  it('uses code field when no blockReason is present', () => {
    expect(normalizeError({ status: 400 }, { code: 'validation' }).code).toBe('validation');
  });

  it('attaches retryAfterSeconds as a number on 429', () => {
    const e = normalizeError({ status: 429 }, { error: 'slow down', retryAfterSeconds: '30' });
    expect(e.retryAfterSeconds).toBe(30);
  });

  it('attaches the redirect chain and sources arrays when present', () => {
    const e = normalizeError({ status: 400 }, { err: 'loop', chain: ['a', 'b'], sources: ['x'] });
    expect(e.chain).toEqual(['a', 'b']);
    expect(e.sources).toEqual(['x']);
  });

  it('supplies a default message when the body has none', () => {
    expect(normalizeError({ status: 401 }, null).message).toMatch(/api key/i);
    expect(normalizeError({ status: 503 }, {}).message).toMatch(/unavailable/i);
    expect(normalizeError({}, null)).toMatchObject({ status: 0, code: null });
  });
});

describe('request', () => {
  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resLike(200, { shortId: 'abc' })));
    await expect(request('http://x/api')).resolves.toEqual({ shortId: 'abc' });
  });

  it('throws a normalized ApiError on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resLike(429, { error: 'rate', retryAfterSeconds: 12 })));
    await expect(request('http://x/api', { method: 'POST', body: { a: 1 } }))
      .rejects.toMatchObject({ status: 429, code: null, retryAfterSeconds: 12 });
  });

  it('maps a thrown fetch (network failure) to status 0 / code "network"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    await expect(request('http://x/api')).rejects.toMatchObject({ status: 0, code: 'network' });
  });

  it('still throws on a non-OK response with a non-JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resLike(403, undefined)));
    await expect(request('http://x/api')).rejects.toMatchObject({ status: 403 });
  });
});
