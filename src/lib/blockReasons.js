// ─────────────────────────────────────────────────────────────────────────────
// Friendly explanations for the backend's `blockReason` codes (400 responses).
// Keep these human and reassuring — they're shown directly to end users.
// ─────────────────────────────────────────────────────────────────────────────
export const BLOCK_REASONS = {
  validation:         "That URL didn't pass our basic checks. Double-check it and try again.",
  dead:               'The destination looks offline (dead link), so we didn’t shorten it.',
  dns:                "We couldn't resolve that domain — it may not exist.",
  ssl:                'The destination has an invalid or untrusted SSL certificate.',
  timeout:            'The destination took too long to respond.',
  connection:         "We couldn't connect to the destination.",
  loop:               'That link redirects in a loop, so it can’t be shortened.',
  'max-hops':         'That link redirects too many times before reaching its destination.',
  'nested-shortener': 'That points to another URL shortener, which isn’t allowed here.',
  'self-redirect':    'That link redirects back to this service.',
  'invalid-redirect': 'That link redirects somewhere we can’t accept.',
  unreachable:        'The destination is currently unreachable.',
  malicious:          'That destination was flagged as potentially malicious and was blocked.',
};

/**
 * @param {string|null|undefined} code
 * @returns {string|null} friendly text, or null if the code is unknown
 */
export function explainBlock(code) {
  return (code && BLOCK_REASONS[code]) || null;
}
