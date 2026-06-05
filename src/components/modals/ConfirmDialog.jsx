import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';

export default function ConfirmDialog({ title, body, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);

  return (
    <Modal title={title} onClose={onClose} width={420}>
      <p style={{ margin: '0 0 22px', fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
        {body}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          icon="trash"
          disabled={busy}
          onClick={async () => { setBusy(true); await onConfirm(); }}
        >
          {busy ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
