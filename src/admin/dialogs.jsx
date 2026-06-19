import { useState } from 'react';
import Modal from '../components/modals/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import { Field, inputStyle } from '../components/ui/Field.jsx';

// Pause a link, optionally recording why. Used from the table and detail pages.
export function DisableDialog({ shortId, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try { await onConfirm(reason.trim() || undefined); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`Pause ${shortId}?`} onClose={onClose} width={420}>
      <p style={{ margin: '0 0 16px', fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
        The link will stop redirecting. Analytics are preserved and you can re-enable it later.
      </p>
      <Field label="Reason" hint="optional">
        <input
          value={reason}
          autoFocus
          onChange={e => setReason(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') go(); }}
          placeholder="e.g. abuse report confirmed"
          style={inputStyle(false)}
        />
      </Field>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" icon="x" disabled={busy} onClick={go}>{busy ? 'Pausing…' : 'Pause link'}</Button>
      </div>
    </Modal>
  );
}
