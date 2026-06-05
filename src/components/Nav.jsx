import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from './ui/Logo.jsx';
import { Store } from '../lib/api.js';
import { useBreakpoint } from '../lib/hooks.js';

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
  const { isMobile } = useBreakpoint();

  // Silent check — stays neutral on failure; only a manual click ever shows 'error'.
  const silentCheck = () => {
    let alive = true;
    setStatus('checking');
    Store.health()
      .then(() => { if (alive) setStatus('ok'); })
      .catch(() => { if (alive) setStatus('unknown'); });
    return () => { alive = false; };
  };

  // Manual click — shows 'error' on failure and starts the 60s cooldown.
  const runCheck = async () => {
    setStatus('checking');
    try {
      await Store.health();
      setStatus('ok');
      setCooldown(COOLDOWN_SECS);
    } catch (e) {
      setStatus(e.status === 0 ? 'unknown' : 'error');
      if (e.status !== 0) setCooldown(COOLDOWN_SECS);
    }
  };

  useEffect(() => silentCheck(), []);

  // Chained timeouts decrement cooldown one second at a time.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Silent re-check halfway through the cooldown without resetting the timer.
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
      aria-label={`Backend status: ${label}${disabled ? `, retry in ${cooldown}s` : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 99,
        // Compact on mobile — show dot only, no label text.
        padding: isMobile ? '7px 10px' : '7px 13px 7px 11px',
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
      {!isMobile && label}
      {!isMobile && disabled && (
        <span style={{ color: 'var(--ink-faint)', fontSize: 11, marginLeft: 2 }}>
          {cooldown}s
        </span>
      )}
    </button>
  );
}

export default function Nav() {
  const location     = useLocation();
  const navigate     = useNavigate();
  const { isMobile } = useBreakpoint();

  const activeRoute = location.pathname === '/dashboard' ? 'dashboard' : 'shorten';

  const tab = (route, label) => {
    const active = activeRoute === route;
    return (
      <button
        onClick={() => navigate(route === 'shorten' ? '/' : '/dashboard')}
        style={{
          background:   active ? '#fff' : 'transparent',
          border:       active ? '2.5px solid var(--ink)' : '2.5px solid transparent',
          borderRadius: 99, padding: isMobile ? '8px 24px' : '8px 18px',
          fontWeight: 800, fontSize: isMobile ? 15 : 14.5, fontFamily: 'var(--sans)',
          cursor: 'pointer', flex: isMobile ? 1 : 'none',
          color:      active ? 'var(--ink)' : 'var(--ink-soft)',
          boxShadow:  active ? '0 3px 0 var(--ink)' : 'none',
          transition: 'all .12s',
        }}
      >
        {label}
      </button>
    );
  };

  // On mobile the layout becomes 2 rows: (logo + health) then (tabs full-width).
  if (isMobile) {
    return (
      <nav style={{ padding: '14px 16px', maxWidth: 1180, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}><Logo size={26} /></div>
          <HealthButton />
        </div>
        <div style={{
          display: 'flex', gap: 8,
          background: 'rgba(255,255,255,.5)', border: '2px solid rgba(42,35,32,.1)',
          borderRadius: 99, padding: 5,
        }}>
          {tab('shorten', 'Shorten')}
          {tab('dashboard', 'Dashboard')}
        </div>
      </nav>
    );
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 32px', maxWidth: 1180, margin: '0 auto', width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}><Logo /></div>

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
      </div>
    </nav>
  );
}
