// ─────────────────────────────────────────────────────────────────────────────
// JSDoc type definitions for every API response shape.
// This file emits no runtime code — it exists purely for editor/type hints.
// Import a type elsewhere with: /** @type {import('../lib/types.js').UrlDoc} */
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One recorded visit to a short link.
 * @typedef {Object} Visit
 * @property {number} timestamp
 * @property {string} ip
 * @property {string} userAgent
 * @property {string} referrer
 * @property {string} [country]
 */

/**
 * Successful create response (POST /api/url → 201).
 * @typedef {Object} CreateUrlResponse
 * @property {string} status   e.g. "Success"
 * @property {string} [shortId] Absent when a honeypot submission was silently dropped
 */

/**
 * Public analytics response (GET /api/url/analytics/:id).
 * @typedef {Object} AnalyticsResponse
 * @property {string} id
 * @property {string} url
 * @property {string} [submittedUrl]
 * @property {boolean} isActive
 * @property {string|null} [disabledReason]
 * @property {number} [abuseReportCount]
 * @property {string|null} [expiresAt]
 * @property {number} invoked
 * @property {Visit[]} history
 */

/**
 * Abuse-report response (POST /report → 201).
 * @typedef {Object} ReportResponse
 * @property {string} status
 * @property {string} [message]
 */

/**
 * Result of a safety/health scan stored on a link.
 * @typedef {Object} ScanResult
 * @property {string|null} checkedAt
 * @property {boolean} safe
 * @property {string[]} sources
 */

/**
 * Full URL document (returned by admin list/detail endpoints — used in Stage B).
 * @typedef {Object} UrlDoc
 * @property {string} shortId
 * @property {string} submittedUrl
 * @property {string} redirectUrl
 * @property {string} finalUrl
 * @property {string[]} redirectChain
 * @property {number|null} httpStatus
 * @property {boolean} isReachable
 * @property {string|null} lastHealthCheck
 * @property {boolean} isActive
 * @property {boolean} isBlocked
 * @property {string|null} blockReason
 * @property {string|null} disabledReason
 * @property {number} abuseReportCount
 * @property {ScanResult} lastScan
 * @property {Visit[]} visitHistory
 * @property {string} creatorIp
 * @property {string} creatorUserAgent
 * @property {string} creatorCountry
 * @property {string|null} expiresAt
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {}; // marks this as a module; no runtime exports
