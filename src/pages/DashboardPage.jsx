import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import ConfirmDialog from '../components/modals/ConfirmDialog.jsx';
import QRModal from '../components/modals/QRModal.jsx';
import { Store } from '../lib/api.js';
import { statusOf, shortUrl, fmtDate } from '../lib/helpers.js';
import { getBaseUrl } from '../lib/helpers.js';

// Strips protocol/www and truncates long paths so URLs read cleanly in the card.
function prettyUrl(raw) {
  try {
    const u       = new URL(raw);
    const display = u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '') + u.search;
    return display.length > 60 ? display.slice(0, 58) + '…' : display;
  } catch {
    return raw;
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{
      height: 86,
      background: 'linear-gradient(100deg,#fff 30%,#f6ede0 50%,#fff 70%)',
      backgroundSize: '200% 100%', animation: 'si-shimmer 1.2s infinite',
      border: '2.5px solid rgba(42,35,32,.12)', borderRadius: 22,
    }} />
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ history }) {
  const days = 7, now = Date.now(), day = 86400000;
  const buckets = new Array(days).fill(0);
  history.forEach(v => {
    const d = Math.floor((now - v.timestamp) / day);
    if (d >= 0 && d < days) buckets[days - 1 - d]++;
  });
  const max = Math.max(1, ...buckets);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 3, height: 40, width: 56,
      background: 'var(--cream)', border: '2px solid var(--ink)',
      borderRadius: 10, padding: '5px 6px', boxSizing: 'border-box',
    }}>
      {buckets.map((b, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(8, (b / max) * 100)}%`,
          background: b > 0 ? 'var(--coral)' : 'rgba(42,35,32,.15)',
          borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

// ── Icon button ───────────────────────────────────────────────────────────────
function IconBtn({ name, title, onClick, copyValue, accent, danger }) {
  const [done, setDone] = useState(false);
  const [h,    setH]    = useState(false);
  const toast = useToast();

  const handle = async () => {
    if (copyValue) {
      try { await navigator.clipboard.writeText(copyValue); } catch {}
      setDone(true); toast('Copied to clipboard');
      setTimeout(() => setDone(false), 1400);
    } else {
      onClick?.();
    }
  };

  const color = done ? 'var(--blue)' : danger ? 'var(--coral)' : accent ? 'var(--ink)' : 'var(--ink-soft)';

  return (
    <button
      onClick={handle}
      title={title}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 38, height: 38, borderRadius: 11, border: '2.5px solid var(--ink)',
        background: h ? (danger ? 'var(--coral-bg)' : accent ? 'var(--cream)' : '#fff') : '#fff',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, boxShadow: h ? '0 4px 0 var(--ink)' : '0 2px 0 var(--ink)',
        transform: h ? 'translateY(-1px)' : 'none', transition: 'all .1s',
      }}
    >
      <Icon name={done ? 'check' : name} size={17} stroke={2.4} />
    </button>
  );
}

// ── Link card ─────────────────────────────────────────────────────────────────
function LinkCard({ link, onAnalytics, onQR, onDelete }) {
  const clicks = link.visitHistory ? link.visitHistory.length : 0;
  const st     = statusOf(link);
  const full   = shortUrl(link.shortId);
  const base   = getBaseUrl().replace(/^https?:\/\//, '');

  return (
    <Card pad={0} hover style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px', flexWrap: 'wrap' }}>
        <div style={{ flexShrink: 0 }}>
          <Sparkline history={link.visitHistory || []} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={full}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', textDecoration: 'none', color: 'var(--ink)' }}
            >
              {base}/<span style={{ color: 'var(--coral)' }}>{link.shortId}</span>
            </a>
            <StatusPill status={st} size="sm" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, color: 'var(--ink-soft)', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--mono)' }}>
            <Icon name="arrow" size={13} stroke={2.4} style={{ flexShrink: 0 }} />
            <span title={link.redirectUrl} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
              {prettyUrl(link.redirectUrl)}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 64 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'var(--mono)' }}>
            {clicks.toLocaleString()}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', marginTop: 3 }}>clicks</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>created</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{fmtDate(link.createdAt)}</div>
        </div>
        <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
          <IconBtn name="copy"  title="Copy"      copyValue={full} />
          <IconBtn name="qr"    title="QR code"   onClick={onQR} />
          <IconBtn name="chart" title="Analytics" onClick={onAnalytics} accent />
          <IconBtn name="trash" title="Delete"    onClick={onDelete} danger />
        </div>
      </div>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ q, onNew }) {
  return (
    <Card style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, background: 'var(--cream)',
        border: '2.5px solid var(--ink)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 18px', transform: 'rotate(-5deg)',
      }}>
        <Icon name={q ? 'search' : 'link'} size={30} stroke={2.2} />
      </div>
      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{q ? 'No matches' : 'No links yet'}</h3>
      <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '8px 0 20px', fontSize: 15 }}>
        {q ? 'Try a different search term.' : 'Shorten your first URL to see it here.'}
      </p>
      {!q && <Button icon="scissors" onClick={onNew}>Shorten a link</Button>}
    </Card>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate  = useNavigate();
  const toast     = useToast();
  const [links,   setLinks]   = useState(null);
  const [error,   setError]   = useState('');
  const [q,       setQ]       = useState('');
  const [qr,      setQr]      = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { setLinks(await Store.list()); }
    catch (e) { setError(e.message || 'Could not load your links.'); setLinks([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    try {
      await Store.remove(id);
      setLinks(ls => ls.filter(l => l.shortId !== id));
      toast('Link deleted');
    } catch (e) {
      toast(e.message || 'Delete failed', 'err');
    }
    setConfirm(null);
  };

  const filtered = (links || []).filter(l =>
    !q ||
    l.shortId.toLowerCase().includes(q.toLowerCase()) ||
    (l.redirectUrl || '').toLowerCase().includes(q.toLowerCase())
  );

  const totalClicks = (links || []).reduce((s, l) => s + (l.visitHistory ? l.visitHistory.length : 0), 0);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%', padding: '12px 32px 64px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 26 }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, whiteSpace: 'nowrap' }}>
            Your links
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '6px 0 0', fontSize: 15 }}>
            {links === null ? 'Loading…' : (
              <>
                <b style={{ color: 'var(--ink)' }}>{links.length}</b> link{links.length !== 1 ? 's' : ''}{' '}
                · <b style={{ color: 'var(--ink)' }}>{totalClicks.toLocaleString()}</b> total clicks
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, background: '#fff',
            border: '2.5px solid var(--ink)', borderRadius: 14, padding: '10px 14px',
            boxShadow: '0 3px 0 rgba(42,35,32,.18)', width: 230,
          }}>
            <Icon name="search" size={17} stroke={2.3} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search links…"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, fontWeight: 600, fontFamily: 'var(--sans)' }}
            />
          </div>
          <Button icon="scissors" onClick={() => navigate('/')}>New link</Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Card style={{ borderColor: 'var(--coral)', boxShadow: '0 6px 0 var(--coral)', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
            <Icon name="x" size={18} stroke={2.6} style={{ color: 'var(--coral)' }} />
            {error}
            <Button variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto' }}>Retry</Button>
          </div>
        </Card>
      )}

      {/* List */}
      {links === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0, 1, 2].map(i => <Skeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState q={q} onNew={() => navigate('/')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(l => (
            <LinkCard
              key={l.shortId}
              link={l}
              onAnalytics={() => navigate(`/analytics/${l.shortId}`)}
              onQR={() => setQr(l.shortId)}
              onDelete={() => setConfirm(l)}
            />
          ))}
        </div>
      )}

      {qr && <QRModal id={qr} onClose={() => setQr(null)} />}
      {confirm && (
        <ConfirmDialog
          title="Delete this link?"
          body={`${shortUrl(confirm.shortId)} will stop working immediately and its analytics will be lost. This can't be undone.`}
          onConfirm={() => del(confirm.shortId)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
