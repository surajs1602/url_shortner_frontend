import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import CopyButton from '../components/ui/CopyButton.jsx';
import { Field, inputStyle } from '../components/ui/Field.jsx';
import QR from '../components/QR.jsx';
import Honeypot from '../components/Honeypot.jsx';
import Captcha, { captchaEnabled } from '../components/Captcha.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Store } from '../lib/api.js';
import { validateUrlClient, publicLink, fmtDate, getBaseUrl } from '../lib/helpers.js';
import { explainBlock } from '../lib/blockReasons.js';
import { MAX_URL_LENGTH } from '../config/index.js';
import { useBreakpoint } from '../lib/hooks.js';

// Decorative background blobs — hidden on mobile to prevent horizontal overflow.
function Blobs({ hide }) {
  if (hide) return null;
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
  const navigate     = useNavigate();
  const { isMobile } = useBreakpoint();
  const link         = publicLink(result.id);

  return (
    <div style={{ animation: 'si-pop .26s cubic-bezier(.2,.9,.3,1.25)' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h1 style={{ fontSize: 'clamp(30px,6vw,52px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
          Ta-da! 🎉
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '8px 0 0', fontSize: 15.5 }}>
          Your link is ready to share.
        </p>
      </div>

      <Card pad={isMobile ? 16 : 24} style={{ boxShadow: '0 8px 0 var(--ink)' }}>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <div style={{ padding: 11, background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 16 }}>
            <QR text={link} px={isMobile ? 4 : 5} />
          </div>
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : 220, textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: 'var(--coral)', letterSpacing: '0.04em' }}>
              YOUR SHORT LINK
            </div>
            <div style={{ fontSize: 'clamp(18px,3.4vw,26px)', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6, wordBreak: 'break-all' }}>
              {getBaseUrl().replace(/^https?:\/\//, '')}/
              <span style={{ color: 'var(--coral)' }}>{result.id}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
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
            {/* Links are safety-checked by the backend before each redirect. */}
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}
                 title="The backend verifies the destination is reachable and safe before redirecting.">
              🛡 safety-checked before redirect
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <CopyButton value={link} label="Copy link" full />
          <Button variant="ghost" icon="external" onClick={() => window.open(link, '_blank')} title="Open link" />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 12 : 20, marginTop: 22, flexWrap: 'wrap' }}>
        <Button variant="blue" icon="scissors" onClick={onAgain}>Shorten another</Button>
        <Button variant="plain" iconRight="arrow" onClick={() => navigate('/dashboard')}>View all links</Button>
      </div>
    </div>
  );
}

// Shown when the backend accepts the request but returns no link (honeypot drop).
function GenericSuccess({ onAgain }) {
  return (
    <div style={{ textAlign: 'center', animation: 'si-pop .26s cubic-bezier(.2,.9,.3,1.25)' }}>
      <h1 style={{ fontSize: 'clamp(28px,6vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
        All done ✓
      </h1>
      <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '10px 0 22px', fontSize: 15.5 }}>
        Your request was received.
      </p>
      <Button variant="blue" icon="scissors" onClick={onAgain}>Shorten another</Button>
    </div>
  );
}

function Pill() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: 'var(--blue)', color: '#fff', borderRadius: 99,
      padding: '7px 15px', fontWeight: 800, fontSize: 12.5,
      fontFamily: 'var(--mono)', border: '2px solid var(--ink)',
      marginBottom: 20, whiteSpace: 'nowrap',
      boxShadow: '0 3px 0 var(--ink)',
      animation: 'si-pendulum 2.6s ease-in-out infinite',
    }}>
      <Icon name="zap" size={14} stroke={2.6} />tiny links, big reach
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
  const [block,     setBlock]     = useState(null); // { text, chain? } from a blockReason
  const [cooldown,  setCooldown]  = useState(0);     // 429 retry countdown (seconds)
  const [result,    setResult]    = useState(null);
  const [done,      setDone]      = useState(false);  // generic (no-link) success
  const [website,   setWebsite]   = useState('');     // honeypot — must stay empty
  const [token,     setToken]     = useState('');     // captcha token
  const inputRef         = useRef(null);
  const toast            = useToast();
  const { isMobile }     = useBreakpoint();

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Tick down the rate-limit cooldown once a 429 sets it.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onToken = useCallback(tok => setToken(tok), []);

  const submit = async () => {
    if (cooldown > 0) return;
    let u = url.trim();
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    const check = validateUrlClient(u, MAX_URL_LENGTH);
    if (!check.ok) { setErr(check.message); setBlock(null); inputRef.current?.focus(); return; }
    if (captchaEnabled() && !token) { setErr('Please complete the CAPTCHA to continue.'); return; }

    setErr(''); setBlock(null); setBusy(true);
    try {
      const res = await Store.create({
        url: u,
        slug: slug.trim() || undefined,
        expiresAt: expiresAt || undefined,
        captchaToken: token || undefined,
        website,
      });
      // 200 with no shortId = honeypot/silent drop → show generic success.
      if (res && res.shortId) {
        setResult({ id: res.shortId, url: u, expiresAt: expiresAt || null });
        toast('Short link created');
      } else {
        setDone(true);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  // Map normalized API errors onto the right UI affordance.
  const handleError = (e) => {
    const status = e.status;
    if (status === 429) {
      const secs = e.retryAfterSeconds || 60;
      setCooldown(secs);
      setErr(`Too many requests. Try again in ${secs}s.`);
      toast('Rate limited — please slow down', 'err');
      return;
    }
    if (status === 401) { setErr('This service isn’t accepting requests right now (auth error).'); return; }
    if (status === 409) { setErr('That custom slug is already taken — pick another.'); toast('Slug taken', 'err'); return; }
    if (status === 400) {
      setErr(e.message || 'We couldn’t shorten that link.');
      const text = explainBlock(e.code);
      if (text || e.chain) setBlock({ text, chain: e.chain });
      return;
    }
    setErr(e.message || 'Something went wrong.');
  };

  const reset = () => {
    setUrl(''); setSlug(''); setExpiresAt('');
    setResult(null); setDone(false); setErr(''); setBlock(null); setAdv(false); setToken('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const disabled = busy || cooldown > 0;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '20px 16px 48px' : '24px 24px 60px',
      position: 'relative', overflow: 'hidden',
    }}>
      <Blobs hide={isMobile} />

      <div style={{ position: 'relative', width: 660, maxWidth: '100%' }}>
        {result ? (
          <ResultCard result={result} onAgain={reset} />
        ) : done ? (
          <GenericSuccess onAgain={reset} />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 34 }}>
              <Pill />
              <h1 style={{
                fontSize: 'clamp(36px, 7vw, 64px)', lineHeight: 0.95,
                fontWeight: 800, letterSpacing: '-0.045em', margin: 0,
              }}>
                Squish your<br />giant URLs <span style={{ color: 'var(--coral)' }}>↓</span>
              </h1>
            </div>

            {/* URL input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
              border: `2.5px solid ${err ? 'var(--coral)' : 'var(--ink)'}`,
              borderRadius: 22, padding: isMobile ? '10px 10px 10px 14px' : '10px 10px 10px 20px',
              boxShadow: `0 7px 0 ${err ? 'var(--coral)' : 'var(--ink)'}`,
              transition: 'border-color .1s',
            }}>
              <Icon name="link" size={20} stroke={2.2} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={url}
                onChange={e => { setUrl(e.target.value); setErr(''); setBlock(null); }}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="paste your monster link here…"
                style={{
                  flex: 1, minWidth: 0, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: isMobile ? 15 : 16.5,
                  fontWeight: 600, fontFamily: 'var(--sans)', color: 'var(--ink)',
                }}
              />
              <Button size={isMobile ? 'md' : 'lg'} onClick={submit} disabled={disabled} icon={busy ? undefined : 'scissors'}>
                {busy ? 'Shrinking…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Shrink it!'}
              </Button>
            </div>

            {/* Honeypot — visually hidden, bots fill it and get dropped. */}
            <Honeypot value={website} onChange={setWebsite} />

            {/* Advanced toggle + hint/error */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, minHeight: 22 }}>
              <button
                onClick={() => setAdv(a => !a)}
                aria-expanded={adv}
                aria-controls="advanced-options"
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
                ? <span style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 13, textAlign: 'right' }}>{err}</span>
                : !isMobile && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-faint)' }}>press ⏎ to shorten</span>
              }
            </div>

            {/* blockReason explanation + resolved redirect chain */}
            {block && (
              <Card style={{ marginTop: 14, borderColor: 'var(--coral)', boxShadow: '0 5px 0 var(--coral)' }}>
                {block.text && (
                  <div style={{ display: 'flex', gap: 9, fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                    <Icon name="x" size={17} stroke={2.6} style={{ color: 'var(--coral)', flexShrink: 0, marginTop: 1 }} />
                    <span>{block.text}</span>
                  </div>
                )}
                {block.chain && block.chain.length > 0 && (
                  <div style={{ marginTop: block.text ? 12 : 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 6 }}>Redirect chain</div>
                    <ol style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-soft)', wordBreak: 'break-all' }}>
                      {block.chain.map((c, i) => <li key={i} style={{ marginBottom: 3 }}>{c}</li>)}
                    </ol>
                  </div>
                )}
              </Card>
            )}

            {/* CAPTCHA — renders only when VITE_TURNSTILE_SITE_KEY is set */}
            <Captcha onToken={onToken} />

            {/* Advanced options — single column on mobile */}
            {adv && (
              <div
                id="advanced-options"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 14, marginTop: 16, animation: 'si-slide .18s ease',
                }}
              >
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
        )}
      </div>
    </div>
  );
}
