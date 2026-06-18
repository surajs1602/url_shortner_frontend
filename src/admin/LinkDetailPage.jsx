import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import ConfirmDialog from '../components/modals/ConfirmDialog.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { adminApi } from '../lib/adminApi.js';
import { DisableDialog } from './dialogs.jsx';
import { StatusBadge, Loading, ErrorState } from './ui.jsx';
import { fmtDate, fmtDateTime, relTime } from '../lib/helpers.js';

function Row({ label, children, mono }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderTop: '1.5px solid rgba(42,35,32,.08)' }}>
      <span style={{ width: 140, flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, wordBreak: 'break-all', fontFamily: mono ? 'var(--mono)' : 'var(--sans)' }}>
        {children}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>{title}</h3>
      {children}
    </Card>
  );
}

export default function LinkDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();
  const [doc,   setDoc]   = useState(null);
  const [error, setError] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);

  const load = useCallback(async () => {
    setError('');
    try { setDoc(await adminApi.getUrl(id)); }
    catch (e) { setError(e.message || 'Could not load this link.'); }
  }, [id]);

  useEffect(() => { setDoc(null); load(); }, [load]);

  const enable = async () => {
    try { await adminApi.enableUrl(id); toast(`${id} enabled`); load(); }
    catch (e) { toast(e.message || 'Could not enable', 'err'); }
  };
  const confirmDisable = async (reason) => { await adminApi.disableUrl(id, reason); toast(`${id} paused`); setShowDisable(false); load(); };
  const confirmDelete  = async () => { await adminApi.deleteUrl(id); toast(`${id} deleted`); navigate('/admin/links'); };

  if (error)  return <div><Back navigate={navigate} /><ErrorState message={error} onRetry={load} /></div>;
  if (!doc)   return <div><Back navigate={navigate} /><Loading /></div>;

  const paused  = doc.isActive === false || doc.isBlocked;
  const visits  = (doc.visitHistory || []).slice().reverse();
  const scan    = doc.lastScan || {};

  return (
    <div>
      <Back navigate={navigate} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, fontFamily: 'var(--mono)' }}>{doc.shortId}</h1>
        <StatusBadge doc={doc} />
        <div style={{ display: 'flex', gap: 9, marginLeft: 'auto' }}>
          {paused
            ? <Button variant="ghost" icon="check" onClick={enable}>Enable</Button>
            : <Button variant="ghost" icon="x" onClick={() => setShowDisable(true)}>Disable</Button>}
          <Button variant="danger" icon="trash" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      <Section title="Overview">
        <Row label="Submitted URL" mono>{doc.submittedUrl || '—'}</Row>
        <Row label="Redirect URL"  mono>{doc.redirectUrl || '—'}</Row>
        <Row label="Final URL"     mono>{doc.finalUrl || '—'}</Row>
        {doc.blockReason   && <Row label="Block reason">{doc.blockReason}</Row>}
        {doc.disabledReason && <Row label="Disabled reason">{doc.disabledReason}</Row>}
        <Row label="Abuse reports">{doc.abuseReportCount || 0}</Row>
        <Row label="Expires">{doc.expiresAt ? fmtDate(doc.expiresAt) : 'never'}</Row>
        <Row label="Created">{fmtDateTime(doc.createdAt)}</Row>
        <Row label="Updated">{doc.updatedAt ? fmtDateTime(doc.updatedAt) : '—'}</Row>
      </Section>

      <Section title="Health">
        <Row label="HTTP status" mono>{doc.httpStatus ?? '—'}</Row>
        <Row label="Reachable">{doc.isReachable ? 'Yes' : 'No'}</Row>
        <Row label="Last check">{doc.lastHealthCheck ? `${fmtDateTime(doc.lastHealthCheck)} (${relTime(new Date(doc.lastHealthCheck).getTime())})` : '—'}</Row>
      </Section>

      {Array.isArray(doc.redirectChain) && doc.redirectChain.length > 0 && (
        <Section title="Redirect chain">
          <ol style={{ margin: 0, paddingLeft: 20, fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-soft)', wordBreak: 'break-all' }}>
            {doc.redirectChain.map((u, i) => <li key={i} style={{ marginBottom: 4 }}>{u}</li>)}
          </ol>
        </Section>
      )}

      <Section title="Safety scan">
        <Row label="Safe">{scan.safe === false ? 'No' : scan.safe === true ? 'Yes' : '—'}</Row>
        <Row label="Checked at">{scan.checkedAt ? fmtDateTime(scan.checkedAt) : '—'}</Row>
        <Row label="Sources" mono>{scan.sources && scan.sources.length ? scan.sources.join(', ') : '—'}</Row>
      </Section>

      <Section title="Creator">
        <Row label="IP" mono>{doc.creatorIp || '—'}</Row>
        <Row label="Country">{doc.creatorCountry || '—'}</Row>
        <Row label="User agent" mono>{doc.creatorUserAgent || '—'}</Row>
      </Section>

      <Card>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>
          Visit history <span style={{ color: 'var(--ink-soft)', fontWeight: 700 }}>({visits.length})</span>
        </h3>
        {visits.length === 0 ? (
          <div style={{ color: 'var(--ink-faint)', fontWeight: 700, padding: '8px 0' }}>No visits recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr>{['When', 'IP', 'Country', 'Referrer', 'User agent'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0 10px 8px', fontSize: 11.5, fontWeight: 800, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {visits.slice(0, 50).map((v, i) => (
                  <tr key={i}>
                    <td style={cell}>{fmtDateTime(v.timestamp)}</td>
                    <td style={{ ...cell, fontFamily: 'var(--mono)' }}>{v.ip || '—'}</td>
                    <td style={cell}>{v.country || '—'}</td>
                    <td style={{ ...cell, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.referrer || 'direct'}</td>
                    <td style={{ ...cell, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-soft)' }} title={v.userAgent}>{v.userAgent || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showDisable && <DisableDialog shortId={doc.shortId} onConfirm={confirmDisable} onClose={() => setShowDisable(false)} />}
      {showDelete  && (
        <ConfirmDialog
          title="Delete this link?"
          body={`${doc.shortId} will be permanently removed. This can't be undone.`}
          onConfirm={confirmDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

const cell = { padding: '10px', fontSize: 12.5, fontWeight: 600, borderTop: '1.5px solid rgba(42,35,32,.08)', verticalAlign: 'top' };

function Back({ navigate }) {
  return (
    <button onClick={() => navigate('/admin/links')} style={{
      display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer',
      fontWeight: 800, fontSize: 14, color: 'var(--ink-soft)', fontFamily: 'var(--sans)', marginBottom: 16, padding: 0,
    }}>
      <Icon name="back" size={17} stroke={2.6} />Back to links
    </button>
  );
}
