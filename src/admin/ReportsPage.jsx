import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import { adminApi } from '../lib/adminApi.js';
import { PageHead, Loading, ErrorState, Empty, Badge, useDebounce } from './ui.jsx';
import { fmtDateTime } from '../lib/helpers.js';

const STATUSES = ['', 'open', 'actioned', 'dismissed'];
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : 'All';

export default function ReportsPage() {
  const [status, setStatus] = useState('open');
  const [rows, setRows]   = useState(null);
  const [error, setError] = useState('');
  const q = useDebounce(status, 150);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await adminApi.abuseReports(q || undefined);
      setRows(Array.isArray(data) ? data : (data?.reports || []));
    } catch (e) { setError(e.message || 'Could not load reports.'); setRows([]); }
  }, [q]);

  useEffect(() => { setRows(null); load(); }, [load]);

  return (
    <div>
      <PageHead title="Abuse reports" subtitle="Reports submitted through the public form.">
        <div style={{ display: 'inline-flex', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 0 rgba(42,35,32,.18)' }}>
          {STATUSES.map(s => (
            <button key={s || 'all'} onClick={() => setStatus(s)} style={{
              padding: '8px 14px', border: '2px solid var(--ink)', cursor: 'pointer',
              fontWeight: 800, fontSize: 12.5, fontFamily: 'var(--mono)',
              background: status === s ? 'var(--ink)' : '#fff', color: status === s ? '#fff' : 'var(--ink-soft)',
            }}>{cap(s)}</button>
          ))}
        </div>
      </PageHead>

      {rows === null ? <Loading />
        : error ? <ErrorState message={error} onRetry={load} />
        : rows.length === 0 ? <Empty label="No reports in this view." />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((r, i) => (
              <Card key={i} pad={18}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Link to={`/admin/links/${r.shortId}`} style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 15, color: 'var(--coral)', textDecoration: 'none' }}>
                    {r.shortId}
                  </Link>
                  <Badge label={cap(r.status)} />
                  <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>
                    {fmtDateTime(r.createdAt)}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{r.reason}</div>
                {r.details && <div style={{ marginTop: 5, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{r.details}</div>}
                <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>
                  {r.reporterIp || 'unknown IP'}{r.reporterUserAgent ? ` · ${r.reporterUserAgent}` : ''}
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
