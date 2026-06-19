import { useEffect, useRef } from 'react';
import { TURNSTILE_SITE_KEY } from '../config/index.js';

// True only when a site key is configured — lets callers gate the requirement.
export const captchaEnabled = () => !!TURNSTILE_SITE_KEY;

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

// Loads the Turnstile script once and resolves when window.turnstile is ready.
let scriptPromise = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load CAPTCHA'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget. Renders nothing when no site key is set.
 * @param {{ onToken: (token: string) => void }} props
 */
export default function Captcha({ onToken }) {
  const boxRef    = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!captchaEnabled()) return;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !boxRef.current || !window.turnstile) return;
        widgetRef.current = window.turnstile.render(boxRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: token => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
      })
      .catch(err => console.error('[ShortIt]', err.message));

    return () => {
      cancelled = true;
      // Clean up the widget so we don't leak iframes across remounts.
      if (widgetRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetRef.current); } catch {}
      }
    };
  }, [onToken]);

  if (!captchaEnabled()) return null;
  return <div ref={boxRef} style={{ marginTop: 14 }} />;
}
