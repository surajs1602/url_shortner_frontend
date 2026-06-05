import Icon from './Icon.jsx';

export function Field({ label, hint, children, error }) {
  return (
    <label style={{ display: 'block' }}>
      {label && (
        <div style={{
          fontWeight: 800, fontSize: 13.5, marginBottom: 7,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{label}</span>
          {hint && (
            <span style={{
              color: 'var(--ink-soft)', fontWeight: 600,
              fontFamily: 'var(--mono)', fontSize: 12,
            }}>
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
      {error && (
        <div style={{
          color: 'var(--coral)', fontWeight: 700, fontSize: 12.5,
          marginTop: 6, display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Icon name="x" size={13} stroke={2.8} />{error}
        </div>
      )}
    </label>
  );
}

export const inputStyle = (err = false) => ({
  width: '100%', padding: '13px 15px', fontSize: 15.5,
  fontFamily: 'var(--sans)', fontWeight: 600, color: 'var(--ink)',
  background: '#fff', border: `2.5px solid ${err ? 'var(--coral)' : 'var(--ink)'}`,
  borderRadius: 14, outline: 'none',
  boxShadow: '0 3px 0 ' + (err ? 'var(--coral)' : 'rgba(42,35,32,.18)'),
});
