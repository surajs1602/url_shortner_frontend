import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/adminApi.js';
import LinksTable from './LinksTable.jsx';
import { useModeration } from './useModeration.jsx';
import { PageHead, Loading, ErrorState, Empty } from './ui.jsx';

export default function BlockedPage() {
  const navigate = useNavigate();
  const [rows, setRows]   = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await adminApi.blockedUrls();
      setRows(Array.isArray(data) ? data : (data?.urls || []));
    } catch (e) {
      setError(e.message || 'Could not load blocked links.');
      setRows([]);
    }
  }, []);

  useEffect(() => { setRows(null); load(); }, [load]);

  const mod = useModeration(load);

  return (
    <div>
      <PageHead title="Blocked links" subtitle="Links auto-blocked by health or safety checks." />
      {rows === null ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <Empty label="Nothing is blocked right now. 🎉" />
      ) : (
        <LinksTable
          rows={rows}
          onView={id => navigate(`/admin/links/${id}`)}
          onDisable={mod.onDisable}
          onEnable={mod.onEnable}
          onDelete={mod.onDelete}
        />
      )}
      {mod.dialogs}
    </div>
  );
}
