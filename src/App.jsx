import { lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
// ShortenPage is the landing route — keep it eager so first paint is instant.
import ShortenPage from './pages/ShortenPage.jsx';
import { APP_NAME, AUTHOR_NAME, AUTHOR_URL } from './config/index.js';

// Lazy-load secondary pages so they're split into separate chunks.
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const WakeUpPage    = lazy(() => import('./pages/WakeUpPage.jsx'));
const ReportPage    = lazy(() => import('./pages/ReportPage.jsx'));
// Admin panel is a separate shell (own nav, no public chrome) and its own chunk.
const AdminApp      = lazy(() => import('./admin/AdminApp.jsx'));

// Minimal fallback — matches the cream background so there's no flash of white.
function PageFallback() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13,
    }}>
      Loading…
    </div>
  );
}

function AppInner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/"              element={<ShortenPage />} />
            <Route path="/dashboard"     element={<DashboardPage />} />
            <Route path="/analytics/:id" element={<AnalyticsPage />} />
            <Route path="/go/:id"        element={<WakeUpPage />} />
            <Route path="/report"        element={<ReportPage />} />
            <Route path="/report/:id"    element={<ReportPage />} />
            <Route path="*"              element={<ShortenPage />} />
          </Routes>
        </Suspense>
      </main>
      <footer style={{
        textAlign: 'center', padding: '20px',
        color: 'var(--ink-faint)', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--mono)',
      }}>
        {APP_NAME} · made for tiny links · built by{' '}
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            color: 'var(--coral)', textDecoration: 'none', fontWeight: 800,
            borderBottom: '1.5px solid currentColor', paddingBottom: 1,
          }}
        >
          {AUTHOR_NAME}
        </a>
        <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
        <Link to="/report" style={{ color: 'var(--ink-soft)', textDecoration: 'none', fontWeight: 700 }}>
          Report a link
        </Link>
      </footer>
    </div>
  );
}

// Pick the shell by URL prefix so each renders its own top-level <Routes>
// (avoids nested-splat path issues and keeps the public chrome off /admin).
function Shell() {
  const isAdmin = useLocation().pathname.startsWith('/admin');
  if (isAdmin) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }
  return <AppInner />;
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
