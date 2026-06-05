import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../ui/Toast.jsx';

export default function ConfirmDialog({ title, body, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } catch (e) {
      // Surface the error as a toast so the modal doesn't silently freeze on failure.
      toast(e?.message || 'Something went wrong', 'err');
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} width={420}>
      <p style={{ margin: '0 0 22px', fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
        {body}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" icon="trash" disabled={busy} onClick={handleConfirm}>
          {busy ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
