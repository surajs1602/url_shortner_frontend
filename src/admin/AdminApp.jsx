import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './auth.jsx';
import AdminLogin from './AdminLogin.jsx';
import AdminLayout from './AdminLayout.jsx';
import LinksPage from './LinksPage.jsx';
import LinkDetailPage from './LinkDetailPage.jsx';
import BlockedPage from './BlockedPage.jsx';
import ReportsPage from './ReportsPage.jsx';
import BannedIpsPage from './BannedIpsPage.jsx';
import HealthPage from './HealthPage.jsx';
import LogsPage from './LogsPage.jsx';

function Splash() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontWeight: 700,
    }}>
      Checking session…
    </div>
  );
}

function Gate() {
  const { status } = useAdminAuth();
  if (status === 'loading') return <Splash />;
  if (status === 'out')     return <AdminLogin />;

  // Routes are relative to the parent "/admin/*" route in App.jsx.
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index             element={<Navigate to="/admin/links" replace />} />
        <Route path="links"      element={<LinksPage />} />
        <Route path="links/:id"  element={<LinkDetailPage />} />
        <Route path="blocked"    element={<BlockedPage />} />
        <Route path="reports"    element={<ReportsPage />} />
        <Route path="banned-ips" element={<BannedIpsPage />} />
        <Route path="health"     element={<HealthPage />} />
        <Route path="logs"       element={<LogsPage />} />
        <Route path="*"          element={<Navigate to="/admin/links" replace />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Gate />
    </AdminAuthProvider>
  );
}
