import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAdminAuth } from './auth.jsx';
import { useBreakpoint } from '../lib/hooks.js';

const NAV = [
  { to: '/admin/links',      label: 'Links',         icon: 'link' },
  { to: '/admin/blocked',    label: 'Blocked',       icon: 'x' },
  { to: '/admin/reports',    label: 'Abuse reports', icon: 'chart' },
  { to: '/admin/banned-ips', label: 'Banned IPs',    icon: 'globe' },
  { to: '/admin/health',     label: 'Health sweep',  icon: 'zap' },
  { to: '/admin/logs',       label: 'Logs',          icon: 'calendar' },
];

function NavItem({ to, label, icon, compact }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: compact ? '9px 12px' : '10px 13px', borderRadius: 12,
        fontWeight: 800, fontSize: 14, textDecoration: 'none',
        whiteSpace: 'nowrap',
        color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
        background: isActive ? '#fff' : 'transparent',
        border: isActive ? '2.5px solid var(--ink)' : '2.5px solid transparent',
        boxShadow: isActive ? '0 3px 0 var(--ink)' : 'none',
      })}
    >
      <Icon name={icon} size={16} stroke={2.4} />
      {!compact && label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate   = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();
  const compact = isTablet; // icon-only rail on tablet & mobile

  const doLogout = async () => { await logout(); navigate('/admin', { replace: true }); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--cream)' }}>
      {/* Sidebar */}
      <aside style={{
        width: compact ? 64 : 232, flexShrink: 0,
        borderRight: '2.5px solid var(--ink)', background: 'rgba(255,255,255,.5)',
        display: 'flex', flexDirection: 'column', padding: compact ? '16px 8px' : '20px 16px',
        position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box',
      }}>
        <div
          onClick={() => navigate('/')}
          title="Back to ShortIt"
          style={{ cursor: 'pointer', marginBottom: 24, paddingLeft: compact ? 4 : 6 }}
        >
          {compact ? <Logo size={26} /> : <Logo size={26} />}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV.map(n => <NavItem key={n.to} {...n} compact={compact} />)}
        </nav>
        <button
          onClick={doLogout}
          title="Sign out"
          style={{
            marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, justifyContent: compact ? 'center' : 'flex-start',
            padding: '10px 13px', borderRadius: 12, border: '2.5px solid var(--ink)', background: '#fff',
            cursor: 'pointer', fontWeight: 800, fontSize: 14, color: 'var(--ink)', boxShadow: '0 3px 0 var(--ink)',
          }}
        >
          <Icon name="back" size={16} stroke={2.4} />
          {!compact && 'Sign out'}
        </button>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0, padding: isMobile ? '20px 16px 48px' : '28px 28px 64px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
