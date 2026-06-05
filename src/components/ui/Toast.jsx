import { createContext, useCallback, useContext, useState } from 'react';
import Icon from './Icon.jsx';

// Throw at call-site when useToast is used outside its provider instead of silently no-oping.
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {/* aria-live ensures screen readers announce each new toast automatically. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1000,
          alignItems: 'center', pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} className="si-toast" style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'var(--ink)', color: '#fff',
            padding: '12px 18px', borderRadius: 14, fontWeight: 700, fontSize: 14.5,
            boxShadow: '0 10px 30px -8px rgba(0,0,0,.4)', whiteSpace: 'nowrap',
          }}>
            <Icon
              name={t.kind === 'err' ? 'x' : 'check'}
              size={17}
              stroke={2.6}
              style={{ color: t.kind === 'err' ? 'var(--coral)' : 'var(--mint)' }}
            />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
