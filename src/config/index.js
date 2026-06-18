// ─────────────────────────────────────────────────────────────────────────────
// Global config — edit this file to change app-wide settings.
// ─────────────────────────────────────────────────────────────────────────────

// App identity
export const APP_NAME       = 'ShortIt';
export const APP_TAGLINE    = 'tiny links, big reach';
export const AUTHOR_NAME    = 'Suraj Sharma';
export const AUTHOR_URL     = 'https://suraj-sharma.me';

// Backend — set both in your .env file.
// VITE_API_BASE_URL : your backend URL (non-secret, just a URL)
// VITE_API_KEY      : your x-api-key secret (baked into the JS bundle at build
//                     time — keep .env git-ignored and never commit real values)
export const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const DEFAULT_API_KEY  = import.meta.env.VITE_API_KEY      || '';

// Frontend public URL — used to build shareable /go/:id short links.
// Set VITE_APP_URL in .env to your deployed frontend (e.g. https://shortit.vercel.app).
// Falls back to window.location.origin at runtime so local dev works without config.
export const APP_URL = import.meta.env.VITE_APP_URL || '';

// localStorage keys
export const CFG_STORAGE_KEY  = 'shortit_cfg_v1';  // { baseUrl, apiKey }
export const MOCK_STORAGE_KEY = 'shortit_mock_v1'; // demo seed data

// Health check — called once on app load (GET {baseUrl}/health)
export const HEALTH_PATH = '/health';

// API paths
export const API_URL_PATH       = '/api/url';
export const API_ANALYTICS_PATH = '/api/url/analytics';
export const REPORT_PATH        = '/report';

// CAPTCHA — Cloudflare Turnstile site key (public, safe to ship).
// Leave empty to disable the widget entirely (feature-flagged).
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

// Max URL length accepted client-side — mirrors the backend's limit.
export const MAX_URL_LENGTH = 2048;
