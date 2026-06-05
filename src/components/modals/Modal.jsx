import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon.jsx';

// Selector for all keyboard-reachable elements — used to trap focus inside the modal.
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Modal({ title, onClose, children, width = 480 }) {
  const panelRef  = useRef(null);
  const titleId   = useRef(`modal-title-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Focus the first interactive element so keyboard users don't have to Tab to get in.
    const first = panel.querySelector(FOCUSABLE);
    first?.focus();

    const onKey = e => {
      if (e.key === 'Escape') { onClose(); return; }

      // Trap Tab/Shift+Tab inside the modal.
      if (e.key === 'Tab') {
        const els   = [...panel.querySelectorAll(FOCUSABLE)];
        const first = els[0];
        const last  = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
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
          <h3
            id={titleId.current}
            style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
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
