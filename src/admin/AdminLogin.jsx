import { useState } from 'react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import Logo from '../components/ui/Logo.jsx';
import { Field, inputStyle } from '../components/ui/Field.jsx';
import { useAdminAuth } from './auth.jsx';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const submit = async () => {
    if (!password) { setErr('Enter the operator password.'); return; }
    setErr(''); setBusy(true);
    try {
      await login(password);
    } catch (e) {
      // 503 = server not configured; 401 = wrong password; 0 = BFF unreachable.
      if (e.status === 503)      setErr(e.message || 'Admin login is not configured on the server.');
      else if (e.status === 401) setErr('Incorrect password.');
      else if (e.status === 0)   setErr('Can’t reach the admin proxy. Is the BFF running?');
      else                       setErr(e.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 20,
    }}>
      <div style={{ marginBottom: 24 }}><Logo size={30} /></div>
      <Card pad={28} style={{ width: 380, maxWidth: '100%', boxShadow: '0 8px 0 var(--ink)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <Icon name="settings" size={20} stroke={2.4} style={{ color: 'var(--coral)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Admin sign-in</h1>
        </div>
        <p style={{ color: 'var(--ink-soft)', fontWeight: 700, fontSize: 13.5, margin: '0 0 20px' }}>
          Operators only. The admin key stays on the server.
        </p>
        <Field label="Operator password" error={err}>
          <input
            type="password"
            value={password}
            autoFocus
            onChange={e => { setPassword(e.target.value); setErr(''); }}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            style={inputStyle(!!err)}
          />
        </Field>
        <div style={{ marginTop: 18 }}>
          <Button onClick={submit} disabled={busy} full icon={busy ? undefined : 'arrow'}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
