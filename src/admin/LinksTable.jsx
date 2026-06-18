import Icon from '../components/ui/Icon.jsx';
import Card from '../components/ui/Card.jsx';
import { StatusBadge } from './ui.jsx';
import { fmtDate, relTime } from '../lib/helpers.js';

function ActionBtn({ name, title, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 32, height: 32, borderRadius: 9, border: '2px solid var(--ink)', background: '#fff',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? 'var(--coral)' : 'var(--ink-soft)', flexShrink: 0,
      }}
    >
      <Icon name={name} size={15} stroke={2.4} />
    </button>
  );
}

const th = { textAlign: 'left', padding: '0 12px 10px', fontSize: 11.5, fontWeight: 800, color: 'var(--ink-soft)', whiteSpace: 'nowrap' };
const td = { padding: '12px', fontSize: 13, fontWeight: 600, verticalAlign: 'middle', borderTop: '1.5px solid rgba(42,35,32,.08)' };

// Shared links table used by the Links and Blocked pages.
export default function LinksTable({ rows, onView, onDisable, onEnable, onDelete }) {
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ ...th, paddingLeft: 18 }}>Short ID</th>
              <th style={th}>Destination</th>
              <th style={th}>Status</th>
              <th style={th}>HTTP</th>
              <th style={th}>Reports</th>
              <th style={th}>Clicks</th>
              <th style={th}>Created</th>
              <th style={th}>Checked</th>
              <th style={{ ...th, paddingRight: 18, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(doc => {
              const clicks   = doc.visitHistory ? doc.visitHistory.length : 0;
              const dest     = doc.finalUrl || doc.redirectUrl || doc.submittedUrl || '—';
              const paused   = doc.isActive === false || doc.isBlocked;
              return (
                <tr key={doc.shortId}>
                  <td style={{ ...td, paddingLeft: 18, fontFamily: 'var(--mono)', fontWeight: 800 }}>
                    <button onClick={() => onView(doc.shortId)} style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      color: 'var(--coral)', fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 13,
                    }}>{doc.shortId}</button>
                  </td>
                  <td style={{ ...td, maxWidth: 260 }}>
                    <span title={dest} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-soft)' }}>
                      {dest.replace(/^https?:\/\//, '')}
                    </span>
                  </td>
                  <td style={td}><StatusBadge doc={doc} /></td>
                  <td style={{ ...td, fontFamily: 'var(--mono)' }}>{doc.httpStatus ?? '—'}</td>
                  <td style={{ ...td, fontFamily: 'var(--mono)', color: doc.abuseReportCount > 0 ? 'var(--coral)' : 'var(--ink-soft)' }}>
                    {doc.abuseReportCount || 0}
                  </td>
                  <td style={{ ...td, fontFamily: 'var(--mono)' }}>{clicks.toLocaleString()}</td>
                  <td style={{ ...td, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{fmtDate(doc.createdAt)}</td>
                  <td style={{ ...td, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                    {doc.lastHealthCheck ? relTime(new Date(doc.lastHealthCheck).getTime()) : '—'}
                  </td>
                  <td style={{ ...td, paddingRight: 18 }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <ActionBtn name="chart" title="View detail" onClick={() => onView(doc.shortId)} />
                      {paused
                        ? <ActionBtn name="check" title="Enable" onClick={() => onEnable(doc)} />
                        : <ActionBtn name="x"     title="Disable" onClick={() => onDisable(doc)} />}
                      <ActionBtn name="trash" title="Delete" danger onClick={() => onDelete(doc)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
