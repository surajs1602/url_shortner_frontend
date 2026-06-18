import Modal from './Modal.jsx';
import QR from '../QR.jsx';
import CopyButton from '../ui/CopyButton.jsx';
import { publicLink } from '../../lib/helpers.js';

export default function QRModal({ id, onClose }) {
  const url = publicLink(id);

  return (
    <Modal title="QR code" onClose={onClose} width={360}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{
          padding: 16, background: '#fff',
          border: '2.5px solid var(--ink)', borderRadius: 18, boxShadow: '0 5px 0 var(--ink)',
        }}>
          <QR text={url} px={6} />
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
          wordBreak: 'break-all', textAlign: 'center',
        }}>
          {url}
        </div>
        <CopyButton value={url} label="Copy link" full />
      </div>
    </Modal>
  );
}
