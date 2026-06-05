import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from './ui/Logo.jsx';
import { Store } from '../lib/api.js';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  unknown:  { dot: 'rgba(42,35,32,0.25)', label: 'Health' },
  checking: { dot: 'var(--amber)',         label: 'Checking…' },
  ok:       { dot: 'var(--mint)',          label: 'Online' },
  error:    { dot: 'var(--coral)',         label: 'Offline' },
};

const COOLDOWN_SECS = 60;

function HealthButton() {
  const [status,   setStatus]   = useState('unknown');
  const [cooldown, setCooldown] = useState(0);
  const [hovered,  setHovered]  = useState(false);

  // Shared helper — resolve health response to a status string
  const resolve = (ok, errStatus) =>
    ok ? 'ok' : errStatus === 0 ? 'unknown' : 'error';

  // Silent check — updates status only, never touches the cooldown.
  // Failures stay 'unknown' (grey) — only a manual click ever shows 'error'.
  const silentCheck = () => {
    let alive = true;
    setStatus('checking');
    Store.health()
      .then(() => { if (alive) setStatus('ok'); })
      .catch(() => { if (alive) setStatus('unknown'); });
    return () => { alive = false; };
  };

  // Manual click check — updates status AND starts the 60s cooldown
  const runCheck = async () => {
    setStatus('checking');
    try {
      await Store.health();
      setStatus('ok');
      setCooldown(COOLDOWN_SECS);
    } catch (e) {
      setStatus(resolve(false, e.status));
      if (e.status !== 0) setCooldown(COOLDOWN_SECS);
    }
  };

  // Auto-check on mount — silent, button stays enabled
  useEffect(() => silentCheck(), []);

  // Decrement cooldown every second via chained timeouts
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Silent re-check at the 30s mark — updates status without resetting the timer
  useEffect(() => {
    if (cooldown !== 30) return;
    return silentCheck();
  }, [cooldown]);

  const { dot, label } = STATUS[status];
  const disabled = cooldown > 0;

  return (
    <button
      onClick={runCheck}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={disabled ? `Next check available in ${cooldown}s` : 'Check backend health'}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 99,
        padding: '7px 13px 7px 11px',
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: !disabled && hovered ? '0 4px 0 var(--ink)' : '0 3px 0 var(--ink)',
        transform: !disabled && hovered ? 'translateY(-1px)' : 'none',
        opacity: disabled ? 0.7 : 1,
        fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 12.5,
        transition: 'box-shadow .1s, transform .1s, opacity .1s',
        color: 'var(--ink)',
      }}
    >
      <span
        className={status === 'checking' ? 'si-pulse' : ''}
        style={{ width: 9, height: 9, borderRadius: 99, background: dot, flexShrink: 0 }}
      />
      {label}
      {disabled && (
        <span style={{ color: 'var(--ink-faint)', fontSize: 11, marginLeft: 2 }}>
          {cooldown}s
        </span>
      )}
    </button>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
export default function Nav() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeRoute = location.pathname === '/dashboard' ? 'dashboard' : 'shorten';

  const tab = (route, label) => {
    const active = activeRoute === route;
    return (
      <button
        onClick={() => navigate(route === 'shorten' ? '/' : '/dashboard')}
        style={{
          background:  active ? '#fff' : 'transparent',
          border:      active ? '2.5px solid var(--ink)' : '2.5px solid transparent',
          borderRadius: 99, padding: '8px 18px',
          fontWeight: 800, fontSize: 14.5, fontFamily: 'var(--sans)',
          cursor: 'pointer',
          color:  active ? 'var(--ink)' : 'var(--ink-soft)',
          boxShadow: active ? '0 3px 0 var(--ink)' : 'none',
          transition: 'all .12s',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 32px', maxWidth: 1180, margin: '0 auto', width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <Logo />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,.5)', border: '2px solid rgba(42,35,32,.1)',
        borderRadius: 99, padding: 5,
      }}>
        {tab('shorten', 'Shorten')}
        {tab('dashboard', 'Dashboard')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <HealthButton />
        {/* Reserved slot for future sign-in / account avatar */}
      </div>
    </nav>
  );
}
