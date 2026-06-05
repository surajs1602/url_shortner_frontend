import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import CopyButton from '../components/ui/CopyButton.jsx';
import { Field, inputStyle } from '../components/ui/Field.jsx';
import QR from '../components/QR.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Store } from '../lib/api.js';
import { isValidUrl, shortUrl, fmtDate } from '../lib/helpers.js';
import { getBaseUrl } from '../lib/helpers.js';

function Blobs() {
  return (
    <>
      <div style={{
        position: 'absolute', top: '6%', right: '4%', width: 220, height: 220,
        borderRadius: '50%', background: 'var(--coral)', opacity: 0.1, filter: 'blur(2px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '4%', left: '3%', width: 190, height: 190,
        borderRadius: '50%', background: 'var(--blue)', opacity: 0.1, filter: 'blur(2px)',
        pointerEvents: 'none',
      }} />
    </>
  );
}

function ResultCard({ result, onAgain }) {
  const navigate = useNavigate();
  const link = shortUrl(result.id);

  return (
    <div style={{ animation: 'si-pop .26s cubic-bezier(.2,.9,.3,1.25)' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h1 style={{ fontSize: 'clamp(34px,6vw,52px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
          Ta-da! 🎉
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '8px 0 0', fontSize: 15.5 }}>
          Your link is ready to share.
        </p>
      </div>

      <Card pad={24} style={{ boxShadow: '0 8px 0 var(--ink)' }}>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ padding: 11, background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 16 }}>
            <QR text={link} px={5} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: 'var(--coral)', letterSpacing: '0.04em' }}>
              YOUR SHORT LINK
            </div>
            <div style={{ fontSize: 'clamp(20px,3.4vw,26px)', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6, wordBreak: 'break-all' }}>
              {getBaseUrl().replace(/^https?:\/\//, '')}/
              <span style={{ color: 'var(--coral)' }}>{result.id}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--cream)', borderRadius: 99, padding: '5px 12px', fontWeight: 700, fontSize: 12.5, border: '2px solid var(--ink)' }}>
                <Icon name="chart" size={13} stroke={2.4} />0 clicks
              </span>
              {result.expiresAt
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--cream)', borderRadius: 99, padding: '5px 12px', fontWeight: 700, fontSize: 12.5, border: '2px solid var(--ink)' }}>
                    <Icon name="clock" size={13} stroke={2.4} />until {fmtDate(result.expiresAt)}
                  </span>
                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--cream)', borderRadius: 99, padding: '5px 12px', fontWeight: 700, fontSize: 12.5, border: '2px solid var(--ink)' }}>
                    <Icon name="check" size={13} stroke={2.6} />never expires
                  </span>
              }
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <CopyButton value={link} label="Copy link" full />
          <Button variant="ghost" icon="external" onClick={() => window.open(link, '_blank')} title="Open link" />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 22 }}>
        <Button variant="blue" icon="scissors" onClick={onAgain}>Shorten another</Button>
        <Button variant="plain" iconRight="arrow" onClick={() => navigate('/dashboard')}>View all links</Button>
      </div>
    </div>
  );
}

export default function ShortenPage() {
  const [url,       setUrl]       = useState('');
  const [adv,       setAdv]       = useState(false);
  const [slug,      setSlug]      = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy,      setBusy]      = useState(false);
  const [err,       setErr]       = useState('');
  const [result,    setResult]    = useState(null);
  const inputRef = useRef(null);
  const toast = useToast();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    let u = url.trim();
    if (!u) { setErr('Paste a URL first.'); inputRef.current?.focus(); return; }
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    if (!isValidUrl(u)) { setErr("That doesn't look like a valid URL."); return; }
    setErr('');
    setBusy(true);
    try {
      const res = await Store.create({ url: u, slug: slug.trim() || undefined, expiresAt: expiresAt || undefined });
      setResult({ id: res.shortId, url: u, expiresAt: expiresAt || null });
      toast('Short link created');
    } catch (e) {
      setErr(e.message || 'Something went wrong.');
      if (e.status === 409) toast('That slug is taken', 'err');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setUrl(''); setSlug(''); setExpiresAt('');
    setResult(null); setErr(''); setAdv(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 24px 60px', position: 'relative',
    }}>
      <Blobs />

      <div style={{ position: 'relative', width: 660, maxWidth: '100%' }}>
        {!result ? (
          <>
            {/* Hero heading */}
            <div style={{ textAlign: 'center', marginBottom: 34 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--blue)', color: '#fff', borderRadius: 99,
                padding: '7px 15px', fontWeight: 800, fontSize: 12.5,
                fontFamily: 'var(--mono)', transform: 'rotate(-1.5deg)',
                border: '2px solid var(--ink)', marginBottom: 20, whiteSpace: 'nowrap',
              }}>
                <Icon name="zap" size={14} stroke={2.6} />tiny links, big reach
              </div>
              <h1 style={{
                fontSize: 'clamp(40px, 7vw, 64px)', lineHeight: 0.95,
                fontWeight: 800, letterSpacing: '-0.045em', margin: 0,
              }}>
                Squish your<br />giant URLs <span style={{ color: 'var(--coral)' }}>↓</span>
              </h1>
            </div>

            {/* URL input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
              border: `2.5px solid ${err ? 'var(--coral)' : 'var(--ink)'}`,
              borderRadius: 22, padding: '10px 10px 10px 20px',
              boxShadow: `0 7px 0 ${err ? 'var(--coral)' : 'var(--ink)'}`,
              transition: 'border-color .1s',
            }}>
              <Icon name="link" size={20} stroke={2.2} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={url}
                onChange={e => { setUrl(e.target.value); setErr(''); }}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="paste your monster link here…"
                style={{
                  flex: 1, minWidth: 0, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: 16.5, fontWeight: 600,
                  fontFamily: 'var(--sans)', color: 'var(--ink)',
                }}
              />
              <Button size="lg" onClick={submit} disabled={busy} icon={busy ? undefined : 'scissors'}>
                {busy ? 'Shrinking…' : 'Shrink it!'}
              </Button>
            </div>

            {/* Sub-row: advanced toggle + hint/error */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, minHeight: 22 }}>
              <button
                onClick={() => setAdv(a => !a)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: 13.5, color: 'var(--ink-soft)',
                  fontFamily: 'var(--sans)',
                }}
              >
                <Icon name={adv ? 'x' : 'plus'} size={15} stroke={2.6} />
                {adv ? 'Hide options' : 'Custom slug & expiry'}
              </button>
              {err
                ? <span style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 13 }}>{err}</span>
                : <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-faint)' }}>press ⏎ to shorten</span>
              }
            </div>

            {/* Advanced options */}
            {adv && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
                marginTop: 16, animation: 'si-slide .18s ease',
              }}>
                <Field label="Custom slug" hint="optional">
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: '#fff', border: '2.5px solid var(--ink)',
                    borderRadius: 14, overflow: 'hidden', boxShadow: '0 3px 0 rgba(42,35,32,.18)',
                  }}>
                    <span style={{ padding: '13px 4px 13px 13px', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>/</span>
                    <input
                      value={slug}
                      onChange={e => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                      placeholder="my-link"
                      style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '13px 13px 13px 2px', fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', background: 'transparent' }}
                    />
                  </div>
                </Field>
                <Field label="Expires" hint="optional">
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    style={inputStyle(false)}
                  />
                </Field>
              </div>
            )}
          </>
        ) : (
          <ResultCard result={result} onAgain={reset} />
        )}
      </div>
    </div>
  );
}
