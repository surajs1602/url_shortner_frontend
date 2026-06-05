import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Store } from '../lib/api.js';
import Logo from '../components/ui/Logo.jsx';
import Icon from '../components/ui/Icon.jsx';

// ── Constants ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 3000;
const TIMEOUT_SECS     = 90;

// Messages shown as the wait progresses
const WAKE_MESSAGES = [
  { after:  0, text: 'Waking up the server…'       },
  { after: 15, text: 'Still starting up…'           },
  { after: 40, text: 'Almost there, hold tight…'   },
  { after: 70, text: 'Just a few more seconds…'    },
];

function currentMessage(elapsed) {
  return [...WAKE_MESSAGES].reverse().find(m => elapsed >= m.after).text;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WakeUpPage() {
  const { id } = useParams();

  // 'loading' | 'redirecting' | 'timeout' | 'not_found' | 'gone'
  const [state,       setState]       = useState('loading');
  const [elapsed,     setElapsed]     = useState(0);
  const [errorDetail, setErrorDetail] = useState('');

  const startRef      = useRef(Date.now());
  const doneRef       = useRef(false);    // prevents double-redirect in strict mode
  const referrer      = useRef(typeof document !== 'undefined' ? document.referrer : '');

  // ── Elapsed ticker ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(t);
  }, []);

  // ── Polling loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    let dead = false;

    async function poll() {
      if (dead || doneRef.current) return;

      if (Math.floor((Date.now() - startRef.current) / 1000) >= TIMEOUT_SECS) {
        setState('timeout');
        return;
      }

      try {
        const data = await Store.resolve(id, referrer.current);

        if (!dead && !doneRef.current) {
          doneRef.current = true;
          setState('redirecting');
          // replace() keeps the browser history clean — back button goes to
          // wherever the user came from, not the loading page.
          window.location.replace(data.url);
        }
      } catch (e) {
        if (dead) return;

        if (e.permanent) {
          // 404 / 410 — retrying won't help, show a specific error immediately
          setState(e.status === 404 ? 'not_found' : 'gone');
          setErrorDetail(e.message);
          return;
        }

        // Network error or 5xx — service is still sleeping, keep polling
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => { dead = true; };
  }, [id]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', padding: 24,
      backgroundImage:
        'radial-gradient(circle at 12% 18%, rgba(217,119,87,0.07), transparent 38%),' +
        'radial-gradient(circle at 88% 82%, rgba(90,130,210,0.07), transparent 38%)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 28, maxWidth: 460, width: '100%',
      }}>
        <Logo size={34} />

        <div style={{
          background: '#fff', border: '2.5px solid var(--ink)',
          borderRadius: 24, padding: '36px 32px', width: '100%',
          boxShadow: '0 8px 0 var(--ink)', textAlign: 'center',
          animation: 'si-pop .28s cubic-bezier(.2,.9,.3,1.2)',
        }}>
          {state === 'loading'     && <LoadingView elapsed={elapsed} />}
          {state === 'redirecting' && <RedirectingView />}
          {state === 'timeout'     && <TimeoutView onRetry={() => window.location.reload()} />}
          {state === 'not_found'   && <ErrorView title="Link not found"     detail={errorDetail} icon="x" />}
          {state === 'gone'        && <ErrorView title="Link no longer active" detail={errorDetail} icon="clock" />}
        </div>

        {state === 'loading' && (
          <p style={{
            color: 'var(--ink-faint)', fontSize: 12.5, fontWeight: 700,
            fontFamily: 'var(--mono)', margin: 0, textAlign: 'center',
          }}>
            Free-tier service · wakes up after inactivity · up to {TIMEOUT_SECS}s
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function LoadingView({ elapsed }) {
  const progress = Math.min(100, (elapsed / TIMEOUT_SECS) * 100);
  const dots     = '.'.repeat((elapsed % 3) + 1).padEnd(3, ' ');

  return (
    <>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'var(--coral)', border: '2.5px solid var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', margin: '0 auto 22px',
        boxShadow: '0 5px 0 var(--ink)',
        animation: 'si-pulse 1.4s ease-in-out infinite',
      }}>
        <Icon name="zap" size={30} stroke={2.4} />
      </div>

      <h1 style={{
        fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em',
        margin: '0 0 10px',
      }}>
        {currentMessage(elapsed)}
      </h1>

      <p style={{
        color: 'var(--ink-soft)', fontSize: 14.5, fontWeight: 600,
        lineHeight: 1.55, margin: '0 0 26px',
      }}>
        Your link is valid — redirecting you as soon as the
        service responds{dots}
      </p>

      <div style={{
        height: 10, background: 'var(--cream)',
        border: '2px solid var(--ink)', borderRadius: 99, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'var(--coral)', borderRadius: 99,
          transition: 'width 1s linear',
        }} />
      </div>
    </>
  );
}

function RedirectingView() {
  return (
    <>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'var(--mint)', border: '2.5px solid var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', margin: '0 auto 22px', boxShadow: '0 5px 0 var(--ink)',
      }}>
        <Icon name="check" size={30} stroke={2.8} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
        Redirecting…
      </h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, fontWeight: 600, margin: 0 }}>
        Taking you to your destination now.
      </p>
    </>
  );
}

function TimeoutView({ onRetry }) {
  return (
    <>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'var(--cream)', border: '2.5px solid var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 22px', boxShadow: '0 5px 0 var(--ink)',
      }}>
        <Icon name="clock" size={30} stroke={2.2} style={{ color: 'var(--coral)' }} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
        Service timed out
      </h1>
      <p style={{
        color: 'var(--ink-soft)', fontSize: 14.5, fontWeight: 600,
        lineHeight: 1.55, margin: '0 0 24px',
      }}>
        The service didn't respond within {TIMEOUT_SECS} seconds. It may be
        experiencing issues — please try again.
      </p>
      <button
        onClick={onRetry}
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
  );
}

function ErrorView({ title, detail, icon }) {
  return (
    <>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'var(--cream)', border: '2.5px solid var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 22px', boxShadow: '0 5px 0 var(--ink)',
      }}>
        <Icon name={icon} size={30} stroke={2.2} style={{ color: 'var(--coral)' }} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
        {title}
      </h1>
      <p style={{
        color: 'var(--ink-soft)', fontSize: 14.5, fontWeight: 600,
        lineHeight: 1.55, margin: 0,
      }}>
        {detail || 'This link is no longer available.'}
      </p>
    </>
  );
}
