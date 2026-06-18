import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev only: the admin BFF lives in Vercel functions. Run `vercel dev` (default
// :3000) in a second terminal and Vite proxies /bff + /api to it, so the admin
// panel works under `npm run dev` with HMR. Override the target with BFF_DEV_TARGET.
const bffTarget = process.env.BFF_DEV_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bff': { target: bffTarget, changeOrigin: true },
      '/api': { target: bffTarget, changeOrigin: true },
    },
  },
});
