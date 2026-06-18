import { useCallback, useEffect, useState } from 'react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import ConfirmDialog from '../components/modals/ConfirmDialog.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Field, inputStyle } from '../components/ui/Field.jsx';
import { adminApi } from '../lib/adminApi.js';
import { PageHead, Loading, ErrorState, Empty } from './ui.jsx';
import { fmtDateTime } from '../lib/helpers.js';

export default function BannedIpsPage() {
  const toast = useToast();
  const [rows, setRows]   = useState(null);
  const [error, setError] = useState('');
  const [ip, setIp]       = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy]   = useState(false);
  const [formErr, setFormErr] = useState('');
  const [unbanT, setUnbanT]   = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await adminApi.bannedIps();
      setRows(Array.isArray(data) ? data : (data?.ips || []));
    } catch (e) { setError(e.message || 'Could not load banned IPs.'); setRows([]); }
  }, []);

  useEffect(() => { setRows(null); load(); }, [load]);

  const ban = async () => {
    if (!ip.trim()) { setFormErr('Enter an IP address to ban.'); return; }
    setFormErr(''); setBusy(true);
    try {
      await adminApi.banIp(ip.trim(), reason.trim() || undefined);
      toast(`${ip.trim()} banned`);
      setIp(''); setReason('');
      load();
    } catch (e) {
      if (e.status === 400) setFormErr(e.message || 'An IP address is required.');
      else toast(e.message || 'Could not ban IP', 'err');
    } finally { setBusy(false); }
  };

  const confirmUnban = async () => {
    try { await adminApi.unbanIp(unbanT.ip); toast(`${unbanT.ip} unbanned`); }
    catch (e) { toast(e.status === 404 ? 'That IP isn’t banned.' : (e.message || 'Could not unban'), 'err'); }
    setUnbanT(null);
    load();
  };

  return (
    <div>
      <PageHead title="Banned IPs" subtitle="Block abusive sources from creating links or reports." />

      {/* Ban form */}
      <Card pad={18} style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Field label="IP address" hint="required" error={formErr}>
              <input value={ip} onChange={e => { setIp(e.target.value); setFormErr(''); }}
                     onKeyDown={e => { if (e.key === 'Enter') ban(); }}
                     placeholder="e.g. 203.0.113.7" style={inputStyle(!!formErr)} />
            </Field>
          </div>
          <div style={{ flex: '2 1 260px' }}>
            <Field label="Reason" hint="optional">
              <input value={reason} onChange={e => setReason(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') ban(); }}
                     placeholder="e.g. repeated phishing submissions" style={inputStyle(false)} />
            </Field>
          </div>
          <Button icon="plus" disabled={busy} onClick={ban}>{busy ? 'Banning…' : 'Ban IP'}</Button>
        </div>
      </Card>

      {rows === null ? <Loading />
        : error ? <ErrorState message={error} onRetry={load} />
        : rows.length === 0 ? <Empty label="No banned IPs." />
        : (
          <Card pad={0} style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>{['IP', 'Reason', 'Banned by', 'When', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 4 ? 'right' : 'left', padding: '0 14px 10px', paddingLeft: i === 0 ? 18 : 14, fontSize: 11.5, fontWeight: 800, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.ip || i}>
                      <td style={{ ...cell, paddingLeft: 18, fontFamily: 'var(--mono)', fontWeight: 800 }}>{r.ip}</td>
                      <td style={{ ...cell, color: 'var(--ink-soft)' }}>{r.reason || '—'}</td>
                      <td style={{ ...cell, color: 'var(--ink-soft)' }}>{r.bannedBy || '—'}</td>
                      <td style={{ ...cell, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{r.createdAt ? fmtDateTime(r.createdAt) : '—'}</td>
                      <td style={{ ...cell, paddingRight: 18, textAlign: 'right' }}>
                        <button onClick={() => setUnbanT(r)} title="Unban" aria-label={`Unban ${r.ip}`} style={{
                          width: 32, height: 32, borderRadius: 9, border: '2px solid var(--ink)', background: '#fff',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral)',
                        }}>
                          <Icon name="trash" size={15} stroke={2.4} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      {unbanT && (
        <ConfirmDialog
          title={`Unban ${unbanT.ip}?`}
          body="This source will be able to use the service again."
          confirmLabel="Unban"
          onConfirm={confirmUnban}
          onClose={() => setUnbanT(null)}
        />
      )}
    </div>
  );
}

const cell = { padding: '12px 14px', fontSize: 13, fontWeight: 600, borderTop: '1.5px solid rgba(42,35,32,.08)', verticalAlign: 'middle' };
