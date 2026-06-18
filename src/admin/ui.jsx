import { useEffect, useState } from 'react';
import Icon from '../components/ui/Icon.jsx';
import Card from '../components/ui/Card.jsx';

// Debounce a fast-changing value (e.g. a search box) before it triggers fetches.
export function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Consistent status colors across the admin panel.
const BADGE = {
  Active:      { bg: 'var(--mint)',     fg: '#fff' },
  Paused:      { bg: 'var(--amber)',    fg: 'var(--ink)' },
  Blocked:     { bg: 'var(--coral)',    fg: '#fff' },
  Unreachable: { bg: 'var(--ink-soft)', fg: '#fff' },
  Open:        { bg: 'var(--coral)',    fg: '#fff' },
  Actioned:    { bg: 'var(--mint)',     fg: '#fff' },
  Dismissed:   { bg: 'var(--ink-soft)', fg: '#fff' },
};

export function Badge({ label, title }) {
  const c = BADGE[label] || { bg: 'var(--ink-soft)', fg: '#fff' };
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.fg, border: '2px solid var(--ink)', borderRadius: 99,
      padding: '2px 10px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11.5, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// Derive a link's display status from its flags (order matters: blocked wins).
export function linkStatus(doc) {
  if (doc.isBlocked)          return { label: 'Blocked', title: doc.blockReason || 'Auto-blocked' };
  if (doc.isActive === false) return { label: 'Paused',  title: doc.disabledReason || 'Paused by admin' };
  if (doc.isReachable === false) return { label: 'Unreachable', title: 'Last health check failed' };
  return { label: 'Active' };
}

export function StatusBadge({ doc }) {
  const s = linkStatus(doc);
  return <Badge label={s.label} title={s.title} />;
}

// Shared loading / empty / error blocks so every page behaves the same.
export function Loading({ label = 'Loading…' }) {
  return (
    <Card style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--ink-soft)', fontWeight: 700 }}>
      {label}
    </Card>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card style={{ borderColor: 'var(--coral)', boxShadow: '0 6px 0 var(--coral)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, flexWrap: 'wrap' }}>
        <Icon name="x" size={18} stroke={2.6} style={{ color: 'var(--coral)' }} />
        <span>{message}</span>
        {onRetry && (
          <button onClick={onRetry} style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 800, color: 'var(--coral)', fontFamily: 'var(--sans)', fontSize: 14,
          }}>Retry</button>
        )}
      </div>
    </Card>
  );
}

export function Empty({ label }) {
  return (
    <Card style={{ textAlign: 'center', padding: '44px 24px', color: 'var(--ink-faint)', fontWeight: 700 }}>
      {label}
    </Card>
  );
}

// Page heading used at the top of each admin page.
export function PageHead({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '6px 0 0', fontSize: 14 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
