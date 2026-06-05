import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import CopyButton from '../components/ui/CopyButton.jsx';
import QR from '../components/QR.jsx';
import QRModal from '../components/modals/QRModal.jsx';
import { Store } from '../lib/api.js';
import { shortUrl, fmtDate, fmtDateTime, relTime, hostOf, getBaseUrl } from '../lib/helpers.js';
import { useBreakpoint } from '../lib/hooks.js';

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, icon, accent }) {
  return (
    <Card pad={18}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--ink-soft)' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: accent, border: '2px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <Icon name={icon} size={16} stroke={2.6} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 12, fontFamily: 'var(--mono)' }}>
        {value}
      </div>
    </Card>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function ClicksChart({ history }) {
  const days = 14, now = Date.now(), day = 86400000;
  const buckets = new Array(days).fill(0);
  const labels  = new Array(days).fill('');
  for (let i = 0; i < days; i++) {
    const d = new Date(now - (days - 1 - i) * day);
    labels[i] = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  history.forEach(v => {
    const d = Math.floor((now - v.timestamp) / day);
    if (d >= 0 && d < days) buckets[days - 1 - d]++;
  });
  const max = Math.max(1, ...buckets);
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, position: 'relative' }}>
      {buckets.map((b, i) => (
        <div
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', cursor: 'default' }}
        >
          {hover === i && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)',
              background: 'var(--ink)', color: '#fff',
              padding: '5px 9px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap', fontFamily: 'var(--mono)', zIndex: 5,
            }}>
              {b} click{b !== 1 ? 's' : ''}<br />
              <span style={{ opacity: .7 }}>{labels[i]}</span>
            </div>
          )}
          <div style={{
            width: '100%', maxWidth: 34,
            height: `${Math.max(3, (b / max) * 100)}%`,
            background: b > 0 ? (hover === i ? 'var(--ink)' : 'var(--coral)') : 'rgba(42,35,32,.1)',
            border: b > 0 ? '2px solid var(--ink)' : 'none',
            borderRadius: '7px 7px 4px 4px', transition: 'background .1s',
          }} />
          <span style={{
            fontSize: 9.5, fontWeight: 700, color: 'var(--ink-faint)', marginTop: 6,
            fontFamily: 'var(--mono)', writingMode: 'vertical-rl',
            transform: 'rotate(180deg)', height: 34,
          }}>
            {i % 2 === 0 ? labels[i] : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Referrers ─────────────────────────────────────────────────────────────────
function Referrers({ history }) {
  const counts = {};
  history.forEach(v => {
    const h = v.referrer ? hostOf(v.referrer) : 'Direct / none';
    counts[h] = (counts[h] || 0) + 1;
  });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max  = Math.max(1, ...rows.map(r => r[1]));

  if (!rows.length) return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-faint)', fontWeight: 700, fontSize: 14 }}>
      No referrer data yet.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map(([name, n]) => (
        <div key={name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, marginBottom: 5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name={name.includes('Direct') ? 'link' : 'globe'} size={14} stroke={2.3} style={{ color: 'var(--ink-soft)' }} />
              {name}
            </span>
            <span style={{ fontFamily: 'var(--mono)' }}>{n}</span>
          </div>
          <div style={{ height: 9, background: 'var(--cream)', borderRadius: 99, border: '2px solid var(--ink)', overflow: 'hidden' }}>
            <div style={{ width: `${(n / max) * 100}%`, height: '100%', background: 'var(--blue)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Visit list ────────────────────────────────────────────────────────────────
function VisitList({ history }) {
  const { isMobile } = useBreakpoint();
  const rows = history.slice().reverse().slice(0, 8);

  if (!rows.length) return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-faint)', fontWeight: 700, fontSize: 14 }}>
      No visits recorded yet.
    </div>
  );

  const device  = ua => /iPhone|Android|Mobile/i.test(ua) ? 'Mobile' : /Mac|Windows|Linux/i.test(ua) ? 'Desktop' : 'Unknown';
  const browser = ua => /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : /Firefox/i.test(ua) ? 'Firefox' : 'Other';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((v, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', flexWrap: 'wrap',
          borderBottom: i < rows.length - 1 ? '1.5px solid rgba(42,35,32,.1)' : 'none',
        }}>
          <div style={{ width: 9, height: 9, borderRadius: 99, background: 'var(--mint)', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0, width: isMobile ? 'auto' : 110 }}>
            {fmtDateTime(v.timestamp)}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>
            {v.userAgent ? `${device(v.userAgent)} · ${browser(v.userAgent)}` : 'Unknown'}
          </span>
          {!isMobile && (
            <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>
              {v.referrer ? hostOf(v.referrer) : 'direct'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Analytics body ────────────────────────────────────────────────────────────
function AnalyticsBody({ id, data, link, onQR }) {
  const { isMobile, isTablet } = useBreakpoint();
  const history  = (data.history || []).slice().sort((a, b) => a.timestamp - b.timestamp);
  const total    = data.invoked != null ? data.invoked : history.length;
  const st       = data.isActive === false ? 'disabled' : (data.expiresAt && new Date(data.expiresAt) < new Date() ? 'expired' : 'active');
  const now      = Date.now(), day = 86400000;
  const last     = history.length ? history[history.length - 1].timestamp : null;
  const uniques  = new Set(history.map(h => h.ip)).size;
  const last7    = history.filter(h => now - h.timestamp < 7 * day).length;
  const base     = getBaseUrl().replace(/^https?:\/\//, '');

  return (
    <>
      {/* Header card */}
      <Card pad={isMobile ? 16 : 24} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 20, flexWrap: 'wrap' }}>
          {!isMobile && (
            <div style={{ padding: 9, background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 14, flexShrink: 0 }}>
              <QR text={link} px={3.4} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(20px,4vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, wordBreak: 'break-all' }}>
                {base}/<span style={{ color: 'var(--coral)' }}>{id}</span>
              </h1>
              <StatusPill status={st} />
            </div>
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--ink-soft)', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--mono)', textDecoration: 'none', wordBreak: 'break-all' }}
            >
              <Icon name="arrow" size={13} stroke={2.4} style={{ flexShrink: 0 }} />
              {data.url}
            </a>
            {data.expiresAt && (
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>
                Expires {fmtDate(data.expiresAt)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 9, flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
            <CopyButton value={link} label="Copy" variant="ghost" full={isMobile} />
            <Button variant="ghost" icon="qr" onClick={onQR} title="QR code" />
            <Button variant="ghost" icon="external" onClick={() => window.open(link, '_blank')} title="Open" />
          </div>
        </div>
      </Card>

      {/* Stat tiles — auto-fit handles mobile naturally */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatTile label="Total clicks"    value={total.toLocaleString()}   icon="chart" accent="var(--coral)" />
        <StatTile label="Unique visitors" value={uniques.toLocaleString()} icon="globe" accent="var(--blue)" />
        <StatTile label="Last 7 days"     value={last7.toLocaleString()}   icon="zap"   accent="var(--mint)" />
        <StatTile label="Last click"      value={last ? relTime(last) : '—'} icon="clock" accent="var(--amber)" />
      </div>

      {/* Chart */}
      <Card pad={isMobile ? 16 : 24} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Clicks over time</h3>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 700 }}>last 14 days</span>
        </div>
        <ClicksChart history={history} />
      </Card>

      {/* Referrers + visits — stacks to 1 col on tablet and below */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : 'minmax(0,1fr) minmax(0,1.4fr)', gap: 16, alignItems: 'start' }}>
        <Card pad={isMobile ? 16 : 24}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Top referrers</h3>
          <Referrers history={history} />
        </Card>
        <Card pad={isMobile ? 16 : 24}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Recent visits</h3>
          <VisitList history={history} />
        </Card>
      </div>
    </>
  );
}

// ── Analytics page ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { isMobile } = useBreakpoint();
  const [data,  setData]  = useState(null);
  const [error, setError] = useState('');
  const [qr,    setQr]    = useState(false);
  const link = shortUrl(id);

  useEffect(() => {
    let alive = true;
    setData(null); setError('');
    Store.analytics(id)
      .then(d  => { if (alive) setData(d);            })
      .catch(e => { if (alive) setError(e.message || 'Could not load analytics.'); });
    return () => { alive = false; };
  }, [id]);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%', padding: isMobile ? '12px 16px 48px' : '12px 32px 64px', boxSizing: 'border-box' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer',
          fontWeight: 800, fontSize: 14, color: 'var(--ink-soft)',
          fontFamily: 'var(--sans)', marginBottom: 18, padding: 0,
        }}
      >
        <Icon name="back" size={17} stroke={2.6} />Back to dashboard
      </button>

      {error ? (
        <Card style={{ borderColor: 'var(--coral)', boxShadow: '0 6px 0 var(--coral)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
            <Icon name="x" size={18} stroke={2.6} style={{ color: 'var(--coral)' }} />{error}
          </div>
        </Card>
      ) : !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 120, background: '#fff', border: '2.5px solid rgba(42,35,32,.12)', borderRadius: 22 }} />
          <div style={{ height: 280, background: '#fff', border: '2.5px solid rgba(42,35,32,.12)', borderRadius: 22 }} />
        </div>
      ) : (
        <AnalyticsBody id={id} data={data} link={link} onQR={() => setQr(true)} />
      )}

      {qr && <QRModal id={id} onClose={() => setQr(false)} />}
    </div>
  );
}
