import { useEffect } from 'react';
import Icon from '../ui/Icon.jsx';

export default function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(42,35,32,.45)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 900, padding: 24,
        animation: 'si-fade .14s ease',
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--cream)', border: '2.5px solid var(--ink)',
          borderRadius: 24, boxShadow: '0 12px 0 var(--ink)',
          animation: 'si-pop .18s cubic-bezier(.2,.9,.3,1.2)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '2.5px solid var(--ink)',
        }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              border: '2.5px solid var(--ink)', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)',
            }}
          >
            <Icon name="x" size={18} stroke={2.6} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
