import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminAuth, setUnauthorizedHandler } from '../lib/adminApi.js';

// status: 'loading' (checking cookie) | 'in' (authed) | 'out' (needs login)
const AdminAuthCtx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [status, setStatus] = useState('loading');

  // Restore the session on mount by asking the BFF whether the cookie is valid.
  useEffect(() => {
    let alive = true;
    adminAuth.session()
      .then(r => { if (alive) setStatus(r?.authed ? 'in' : 'out'); })
      .catch(() => { if (alive) setStatus('out'); });
    return () => { alive = false; };
  }, []);

  // Any admin call that 401s flips us back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => setStatus('out'));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (password) => {
    await adminAuth.login(password); // throws on bad password / 503
    setStatus('in');
  }, []);

  const logout = useCallback(async () => {
    try { await adminAuth.logout(); } catch { /* clear locally regardless */ }
    setStatus('out');
  }, []);

  return (
    <AdminAuthCtx.Provider value={{ status, login, logout }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthCtx);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
