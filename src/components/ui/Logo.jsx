import Icon from './Icon.jsx';
import { APP_NAME } from '../../config/index.js';

export default function Logo({ size = 30 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{
        width: size, height: size, borderRadius: size / 3,
        background: 'var(--coral)', border: '2.5px solid var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', transform: 'rotate(-6deg)', boxShadow: '0 3px 0 var(--ink)',
      }}>
        <Icon name="scissors" size={size * 0.55} stroke={2.6} />
      </div>
      <span style={{ fontWeight: 800, fontSize: size * 0.66, letterSpacing: '-0.03em' }}>
        {APP_NAME}
      </span>
    </div>
  );
}
