import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Field, inputStyle } from '../components/ui/Field.jsx';
import Honeypot from '../components/Honeypot.jsx';
import Captcha, { captchaEnabled } from '../components/Captcha.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Store } from '../lib/api.js';
import { useBreakpoint } from '../lib/hooks.js';

export default function ReportPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const toast        = useToast();
  const { isMobile } = useBreakpoint();

  const [shortId, setShortId] = useState(id || '');
  const [reason,  setReason]  = useState('');
  const [details, setDetails] = useState('');
  const [website, setWebsite] = useState('');  // honeypot
  const [token,   setToken]   = useState('');  // captcha
  const [busy,    setBusy]    = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [err,     setErr]     = useState('');
  const [sent,    setSent]    = useState(false);

  const onToken = useCallback(tok => setToken(tok), []);

  const submit = async () => {
    if (cooldown > 0) return;
    if (!shortId.trim()) { setErr('Enter the short link ID you’re reporting.'); return; }
    if (reason.trim().length < 3) { setErr('Please give a reason (at least 3 characters).'); return; }
    if (captchaEnabled() && !token) { setErr('Please complete the CAPTCHA to continue.'); return; }

    setErr(''); setBusy(true);
    try {
      await Store.report({
        shortId: shortId.trim(),
        reason: reason.trim(),
        details: details.trim() || undefined,
        captchaToken: token || undefined,
        website,
      });
      setSent(true);
      toast('Report submitted — thank you');
    } catch (e) {
      if (e.status === 429) {
        const secs = e.retryAfterSeconds || 60;
        setCooldown(secs);
        const t = setInterval(() => setCooldown(c => { if (c <= 1) clearInterval(t); return Math.max(0, c - 1); }), 1000);
        setErr(`Too many requests. Try again in ${secs}s.`);
      } else if (e.status === 404) {
        setErr('We couldn’t find a link with that ID.');
      } else {
        setErr(e.message || 'Could not submit your report.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', width: '100%', padding: isMobile ? '16px 16px 48px' : '24px 24px 64px', boxSizing: 'border-box' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none',
          cursor: 'pointer', fontWeight: 800, fontSize: 14, color: 'var(--ink-soft)',
          fontFamily: 'var(--sans)', marginBottom: 18, padding: 0,
        }}
      >
        <Icon name="back" size={17} stroke={2.6} />Back
      </button>

      {sent ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px', boxShadow: '0 8px 0 var(--ink)' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, background: 'var(--mint)',
            border: '2.5px solid var(--ink)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', margin: '0 auto 18px', boxShadow: '0 5px 0 var(--ink)',
          }}>
            <Icon name="check" size={28} stroke={2.8} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Thank you</h1>
          <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '10px 0 22px', fontSize: 15 }}>
            Your report was received. Our team will review this link.
          </p>
          <Button variant="blue" onClick={() => navigate('/')}>Back to home</Button>
        </Card>
      ) : (
        <Card pad={isMobile ? 18 : 28} style={{ boxShadow: '0 8px 0 var(--ink)' }}>
          <h1 style={{ fontSize: 'clamp(24px,5vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Report a link
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontWeight: 700, margin: '8px 0 22px', fontSize: 14.5 }}>
            Spotted a malicious or abusive short link? Let us know and we’ll investigate.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Short link ID" hint="required">
              <input
                value={shortId}
                onChange={e => { setShortId(e.target.value); setErr(''); }}
                placeholder="e.g. MgDl8Xk8"
                style={inputStyle(false)}
              />
            </Field>
            <Field label="Reason" hint="required">
              <input
                value={reason}
                onChange={e => { setReason(e.target.value); setErr(''); }}
                placeholder="e.g. phishing, malware, spam…"
                style={inputStyle(false)}
              />
            </Field>
            <Field label="Details" hint="optional">
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={4}
                placeholder="Anything else that helps us review this link."
                style={{ ...inputStyle(false), resize: 'vertical', fontFamily: 'var(--sans)' }}
              />
            </Field>

            {/* Honeypot — must stay empty */}
            <Honeypot value={website} onChange={setWebsite} />

            {/* CAPTCHA — renders only when configured */}
            <Captcha onToken={onToken} />

            {err && (
              <div style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="x" size={15} stroke={2.8} />{err}
              </div>
            )}

            <Button onClick={submit} disabled={busy || cooldown > 0} full>
              {busy ? 'Submitting…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Submit report'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
