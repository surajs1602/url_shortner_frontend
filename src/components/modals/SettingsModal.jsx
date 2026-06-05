import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, inputStyle } from '../ui/Field.jsx';
import Icon from '../ui/Icon.jsx';
import { getCfg, setCfg } from '../../lib/helpers.js';
import { Store } from '../../lib/api.js';
import { useToast } from '../ui/Toast.jsx';

export default function SettingsModal({ onClose }) {
  const cfg = getCfg();
  const [baseUrl, setBaseUrl] = useState(cfg.baseUrl || '');
  const [apiKey,  setApiKey]  = useState(cfg.apiKey  || '');
  const [test, setTest]       = useState(null); // { ok, msg }
  const [busy, setBusy]       = useState(false);
  const toast = useToast();

  const save = () => {
    setCfg({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim() });
    toast(baseUrl.trim() ? 'Connected to your API' : 'Settings saved');
    onClose();
  };

  const runTest = async () => {
    setBusy(true);
    setTest(null);
    setCfg({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim() });
    try {
      await Store.list();
      setTest({ ok: true, msg: 'Connection works — your links loaded.' });
    } catch (e) {
      setTest({
        ok: false,
        msg: e.status === 401
          ? 'Reached server, but API key was rejected (401).'
          : (e.message || 'Could not reach the server.'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="API connection" onClose={onClose} width={500}>
      <p style={{ margin: '0 0 20px', fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
        Point ShortIt at your backend. Leave blank to keep exploring with demo data — everything still works locally.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Base URL" hint="e.g. https://api.shortit.io">
          <input
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://your-backend.onrender.com"
            style={inputStyle(false)}
          />
        </Field>

        <Field label="API key" hint="sent as x-api-key">
          <input
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="your-secret-api-key"
            type="password"
            style={inputStyle(false)}
          />
        </Field>

        {test && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: test.ok ? 'var(--mint-bg)' : 'var(--coral-bg)',
            border: `2px solid ${test.ok ? 'var(--mint)' : 'var(--coral)'}`,
            borderRadius: 12, padding: '11px 14px', fontWeight: 700, fontSize: 13.5,
          }}>
            <Icon name={test.ok ? 'check' : 'x'} size={16} stroke={2.6} style={{ flexShrink: 0 }} />
            {test.msg}
          </div>
        )}

        {cfg.baseUrl && (
          <button
            onClick={() => { setCfg({}); toast('Reset to demo mode'); onClose(); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-soft)', fontWeight: 700, fontSize: 13, textAlign: 'left',
              padding: 0, fontFamily: 'var(--sans)',
            }}
          >
            Reset to demo mode
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
        <Button variant="ghost" icon="zap" disabled={busy || !baseUrl.trim()} onClick={runTest}>
          {busy ? 'Testing…' : 'Test connection'}
        </Button>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="plain" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
