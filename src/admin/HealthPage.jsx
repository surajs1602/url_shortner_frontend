import { useState } from 'react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Field, inputStyle } from '../components/ui/Field.jsx';
import { adminApi } from '../lib/adminApi.js';
import { PageHead } from './ui.jsx';

function Stat({ label, value, accent }) {
  return (
    <Card pad={18} style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--mono)', letterSpacing: '-0.03em', marginTop: 6, color: accent }}>{value}</div>
    </Card>
  );
}

export default function HealthPage() {
  const toast = useToast();
  const [batchSize, setBatchSize] = useState('50');
  const [busy, setBusy]   = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setBusy(true); setResult(null);
    try {
      const n = parseInt(batchSize, 10);
      const res = await adminApi.healthCheck(Number.isFinite(n) && n > 0 ? n : undefined);
      setResult(res);
      toast('Health sweep complete');
    } catch (e) {
      toast(e.message || 'Health sweep failed', 'err');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHead title="Health sweep" subtitle="Re-check links and auto-disable dead, unreachable, or newly-malicious ones." />

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 160 }}>
            <Field label="Batch size" hint="optional">
              <input type="number" min="1" value={batchSize} onChange={e => setBatchSize(e.target.value)} style={inputStyle(false)} />
            </Field>
          </div>
          <Button icon="zap" disabled={busy} onClick={run}>{busy ? 'Sweeping…' : 'Run health sweep now'}</Button>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="check" size={15} stroke={2.6} style={{ color: 'var(--mint)', flexShrink: 0, marginTop: 2 }} />
          Disabled links keep their analytics — nothing is deleted by a sweep.
        </p>
      </Card>

      {result && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Stat label="Links checked" value={(result.checked ?? 0).toLocaleString()} accent="var(--ink)" />
          <Stat label="Auto-disabled" value={(result.disabled ?? 0).toLocaleString()} accent="var(--coral)" />
        </div>
      )}
    </div>
  );
}
