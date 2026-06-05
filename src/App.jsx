import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import ShortenPage from './pages/ShortenPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import { APP_NAME } from './config/index.js';

function AppInner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"              element={<ShortenPage />} />
          <Route path="/dashboard"     element={<DashboardPage />} />
          <Route path="/analytics/:id" element={<AnalyticsPage />} />
          <Route path="*"              element={<ShortenPage />} />
        </Routes>
      </main>
      <footer style={{
        textAlign: 'center', padding: '20px',
        color: 'var(--ink-faint)', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--mono)',
      }}>
        {APP_NAME} · made for tiny links
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
