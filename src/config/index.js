// ─────────────────────────────────────────────────────────────────────────────
// Global config — edit this file to change app-wide settings.
// ─────────────────────────────────────────────────────────────────────────────

// App identity
export const APP_NAME    = 'ShortIt';
export const APP_TAGLINE = 'tiny links, big reach';

// Backend — set both in your .env file.
// VITE_API_BASE_URL : your backend URL (non-secret, just a URL)
// VITE_API_KEY      : your x-api-key secret (baked into the JS bundle at build
//                     time — keep .env git-ignored and never commit real values)
export const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const DEFAULT_API_KEY  = import.meta.env.VITE_API_KEY      || '';

// localStorage keys
export const CFG_STORAGE_KEY  = 'shortit_cfg_v1';  // { baseUrl, apiKey }
export const MOCK_STORAGE_KEY = 'shortit_mock_v1'; // demo seed data

// Health check — called once on app load (GET {baseUrl}/health)
export const HEALTH_PATH = '/health';

// API paths
export const API_URL_PATH       = '/api/url';
export const API_ANALYTICS_PATH = '/api/url/analytics';
