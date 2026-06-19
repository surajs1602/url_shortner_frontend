import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev only: the admin BFF lives in Vercel functions under /api/bff. Run
// `vercel dev` (default :3000) in a second terminal and Vite proxies /api to it,
// so the admin panel works under `npm run dev` with HMR. Override with BFF_DEV_TARGET.
const bffTarget = process.env.BFF_DEV_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: bffTarget, changeOrigin: true },
    },
  },
});
