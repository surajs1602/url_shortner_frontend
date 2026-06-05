const STATUS_MAP = {
  active:   { color: 'var(--mint)',     label: 'Active' },
  expired:  { color: 'var(--amber)',    label: 'Expired' },
  disabled: { color: 'var(--ink-soft)', label: 'Disabled' },
};

export default function StatusPill({ status, size = 'md' }) {
  const s  = STATUS_MAP[status] || STATUS_MAP.active;
  const fs = size === 'sm' ? 11.5 : 12.5;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#fff', border: '2px solid var(--ink)', borderRadius: 99,
      padding: size === 'sm' ? '2px 9px' : '4px 11px',
      fontFamily: 'var(--mono)', fontWeight: 700, fontSize: fs,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}
