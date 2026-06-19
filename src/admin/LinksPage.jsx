import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { adminApi } from '../lib/adminApi.js';
import LinksTable from './LinksTable.jsx';
import { useModeration } from './useModeration.jsx';
import { PageHead, Loading, ErrorState, Empty, useDebounce } from './ui.jsx';

const PAGE = 25;

// Tri-state filter pill group: All / Yes / No.
function TriFilter({ label, value, onChange }) {
  const opt = (v, t) => (
    <button onClick={() => onChange(v)} style={{
      padding: '6px 12px', border: '2px solid var(--ink)', cursor: 'pointer',
      fontWeight: 800, fontSize: 12.5, fontFamily: 'var(--mono)',
      background: value === v ? 'var(--ink)' : '#fff', color: value === v ? '#fff' : 'var(--ink-soft)',
    }}>{t}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-soft)' }}>{label}</span>
      <div style={{ display: 'inline-flex', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 0 rgba(42,35,32,.18)' }}>
        {opt('', 'All')}{opt('true', 'Yes')}{opt('false', 'No')}
      </div>
    </div>
  );
}

export default function LinksPage() {
  const navigate = useNavigate();
  const [search,    setSearch]    = useState('');
  const [blocked,   setBlocked]   = useState('');
  const [reachable, setReachable] = useState('');
  const [limit,     setLimit]     = useState(PAGE);
  const [rows,  setRows]  = useState(null);
  const [error, setError] = useState('');

  const domain = useDebounce(search, 350);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await adminApi.listUrls({ domain: domain || undefined, blocked: blocked || undefined, reachable: reachable || undefined, limit });
      setRows(Array.isArray(data) ? data : (data?.urls || []));
    } catch (e) {
      setError(e.message || 'Could not load links.');
      setRows([]);
    }
  }, [domain, blocked, reachable, limit]);

  // Reset paging whenever filters change, then (re)load.
  useEffect(() => { setRows(null); load(); }, [load]);

  const mod = useModeration(load);
  const canLoadMore = rows && rows.length >= limit;

  return (
    <div>
      <PageHead title="Links" subtitle="Search, filter, and moderate every short link." />

      {/* Toolbar */}
      <Card pad={16} style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 12, padding: '8px 12px', flex: 1, minWidth: 200 }}>
            <Icon name="search" size={16} stroke={2.3} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setLimit(PAGE); }}
              placeholder="Search by domain or URL…"
              aria-label="Search links by domain"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, fontFamily: 'var(--sans)' }}
            />
          </div>
          <TriFilter label="Blocked"   value={blocked}   onChange={v => { setBlocked(v); setLimit(PAGE); }} />
          <TriFilter label="Reachable" value={reachable} onChange={v => { setReachable(v); setLimit(PAGE); }} />
        </div>
      </Card>

      {rows === null ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <Empty label="No links match these filters." />
      ) : (
        <>
          <LinksTable
            rows={rows}
            onView={id => navigate(`/admin/links/${id}`)}
            onDisable={mod.onDisable}
            onEnable={mod.onEnable}
            onDelete={mod.onDelete}
          />
          {canLoadMore && (
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <Button variant="ghost" onClick={() => setLimit(l => l + PAGE)}>Load more</Button>
            </div>
          )}
        </>
      )}

      {mod.dialogs}
    </div>
  );
}
