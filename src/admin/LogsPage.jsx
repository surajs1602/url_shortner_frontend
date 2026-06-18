import { useCallback, useEffect, useState } from 'react';
import Card from '../components/ui/Card.jsx';
import { adminApi } from '../lib/adminApi.js';
import { PageHead, Loading, ErrorState, Empty } from './ui.jsx';
import { fmtDateTime } from '../lib/helpers.js';

const LEVELS = ['', 'info', 'http', 'error'];
const LIMITS = [50, 100, 250, 500];
const LEVEL_COLOR = { error: 'var(--coral)', http: 'var(--blue)', info: 'var(--ink-soft)', warn: 'var(--amber)' };

// Everything that isn't a known field is treated as structured metadata.
const KNOWN = new Set(['level', 'message', 'timestamp', 'time']);
function meta(entry) {
  return Object.entries(entry).filter(([k]) => !KNOWN.has(k));
}

export default function LogsPage() {
  const [level, setLevel] = useState('');
  const [limit, setLimit] = useState(100);
  const [rows, setRows]   = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await adminApi.logs({ level: level || undefined, limit });
      setRows(Array.isArray(data) ? data : (data?.logs || []));
    } catch (e) { setError(e.message || 'Could not load logs.'); setRows([]); }
  }, [level, limit]);

  useEffect(() => { setRows(null); load(); }, [load]);

  const sel = {
    padding: '8px 12px', border: '2.5px solid var(--ink)', borderRadius: 10,
    fontWeight: 800, fontSize: 13, fontFamily: 'var(--mono)', background: '#fff', cursor: 'pointer',
  };

  return (
    <div>
      <PageHead title="Logs" subtitle="Recent structured log entries from the backend.">
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={level} onChange={e => setLevel(e.target.value)} aria-label="Filter by level" style={sel}>
            {LEVELS.map(l => <option key={l || 'all'} value={l}>{l ? l : 'all levels'}</option>)}
          </select>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} aria-label="Number of entries" style={sel}>
            {LIMITS.map(n => <option key={n} value={n}>{n} rows</option>)}
          </select>
        </div>
      </PageHead>

      {rows === null ? <Loading />
        : error ? <ErrorState message={error} onRetry={load} />
        : rows.length === 0 ? <Empty label="No log entries." />
        : (
          <Card pad={0} style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>{['Level', 'Time', 'Message', 'Meta'].map((h, i) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0 12px 10px', paddingLeft: i === 0 ? 18 : 12, fontSize: 11.5, fontWeight: 800, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rows.map((e, i) => {
                    const m = meta(e);
                    return (
                      <tr key={i}>
                        <td style={{ ...cell, paddingLeft: 18 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 11.5, color: LEVEL_COLOR[e.level] || 'var(--ink-soft)' }}>
                            {(e.level || '—').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ ...cell, color: 'var(--ink-soft)', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 12 }}>
                          {e.timestamp || e.time ? fmtDateTime(e.timestamp || e.time) : '—'}
                        </td>
                        <td style={{ ...cell, fontWeight: 700 }}>{e.message || '—'}</td>
                        <td style={{ ...cell, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-faint)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={m.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')}>
                          {m.length ? m.map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
    </div>
  );
}

const cell = { padding: '10px 12px', fontSize: 13, verticalAlign: 'top', borderTop: '1.5px solid rgba(42,35,32,.08)' };
