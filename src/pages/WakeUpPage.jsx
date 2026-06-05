import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Store } from '../lib/api.js';
import { getBaseUrl } from '../lib/helpers.js';
import Logo from '../components/ui/Logo.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useBreakpoint } from '../lib/hooks.js';

const POLL_MS      = 3000;
const TIMEOUT_SECS = 90;

export default function WakeUpPage() {
  const { id }       = useParams();
  const { isMobile } = useBreakpoint();

  // 'waiting' | 'redirecting' | 'timeout'
  const [state,   setState]   = useState('waiting');
  const [elapsed, setElapsed] = useState(0);

  const startRef  = useRef(Date.now());
  const doneRef   = useRef(false);

  // Tick elapsed seconds
  useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(t);
  }, []);

  // Polling loop
  useEffect(() => {
    let dead = false;

    async function poll() {
      if (dead || doneRef.current) return;

      if (Math.floor((Date.now() - startRef.current) / 1000) >= TIMEOUT_SECS) {
        setState('timeout');
        return;
      }

      try {
        await Store.health();
        if (!dead && !doneRef.current) {
          doneRef.current = true;
          setState('redirecting');
          // Hand off to the backend — it records the visit and 302s to the real URL
          window.location.href = `${getBaseUrl()}/${id}`;
        }
      } catch {
        if (!dead) setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => { dead = true; };
  }, [id]);

  const remaining = Math.max(0, TIMEOUT_SECS - elapsed);
  const progress  = Math.min(100, (elapsed / TIMEOUT_SECS) * 100);
  const dots      = '.'.repeat((elapsed % 3) + 1).padEnd(3, ' ');

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', padding: isMobile ? 16 : 24,
      backgroundImage:
        'radial-gradient(circle at 15% 20%, rgba(217,119,87,0.07), transparent 40%),' +
        'radial-gradient(circle at 85% 80%, rgba(90,130,210,0.07), transparent 40%)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 28, maxWidth: 440, width: '100%',
      }}>
        <Logo size={32} />

        <div style={{
          background: '#fff', border: '2.5px solid var(--ink)',
          borderRadius: 24, padding: isMobile ? '28px 20px' : '36px 30px', width: '100%',
          boxShadow: '0 8px 0 var(--ink)', textAlign: 'center',
          animation: 'si-pop .28s cubic-bezier(.2,.9,.3,1.2)',
        }}>
          {state === 'waiting' && (
            <>
              {/* Pulsing icon */}
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: 'var(--coral)', border: '2.5px solid var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', margin: '0 auto 22px',
                boxShadow: '0 5px 0 var(--ink)',
                animation: 'si-pulse 1.4s ease-in-out infinite',
              }}>
                <Icon name="zap" size={28} stroke={2.4} />
              </div>

              <h2 style={{
                fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em',
                margin: '0 0 12px',
              }}>
                Please wait{dots}
              </h2>

              <p style={{
                color: 'var(--ink-soft)', fontSize: 15, fontWeight: 600,
                lineHeight: 1.6, margin: '0 0 8px',
              }}>
                The service is going up!
              </p>
              <p style={{
                color: 'var(--ink-faint)', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--mono)', margin: '0 0 26px',
              }}>
                This is just a demo project — it sleeps after inactivity.
              </p>

              {/* Progress bar */}
              <div style={{
                height: 9, background: 'var(--cream)',
                border: '2px solid var(--ink)', borderRadius: 99, overflow: 'hidden',
                marginBottom: 10,
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--coral)', borderRadius: 99,
                  transition: 'width 1s linear',
                }} />
              </div>
              <p style={{
                color: 'var(--ink-faint)', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--mono)', margin: 0,
              }}>
                timing out in {remaining}s
              </p>
            </>
          )}

          {state === 'redirecting' && (
            <>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: 'var(--mint)', border: '2.5px solid var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', margin: '0 auto 22px', boxShadow: '0 5px 0 var(--ink)',
              }}>
                <Icon name="check" size={28} stroke={2.8} />
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
                We're up!
              </h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 15, fontWeight: 600, margin: 0 }}>
                Taking you there now…
              </p>
            </>
          )}

          {state === 'timeout' && (
            <>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: 'var(--cream)', border: '2.5px solid var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 22px', boxShadow: '0 5px 0 var(--ink)',
              }}>
                <Icon name="clock" size={28} stroke={2.2} style={{ color: 'var(--coral)' }} />
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
                Still not responding
              </h2>
              <p style={{
                color: 'var(--ink-soft)', fontSize: 15, fontWeight: 600,
                lineHeight: 1.6, margin: '0 0 24px',
              }}>
                The service didn't respond in {TIMEOUT_SECS}s.
                It may be experiencing issues — please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--coral)', color: '#fff',
                  border: '2.5px solid var(--ink)', borderRadius: 14,
                  padding: '12px 22px', fontWeight: 800, fontSize: 15,
                  fontFamily: 'var(--sans)', cursor: 'pointer',
                  boxShadow: '0 5px 0 var(--ink)',
                }}
              >
                <Icon name="zap" size={16} stroke={2.6} />
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
