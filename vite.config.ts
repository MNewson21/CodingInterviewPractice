import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Dev-only: point the /piston proxy at a remote Piston (e.g. an AWS test box) by
  // setting VITE_PISTON_PROXY_TARGET in .env.local (gitignored). Defaults to the local
  // Piston container — keeps any real instance IP out of the committed config.
  const env = loadEnv(mode, process.cwd(), '');
  const pistonTarget = env.VITE_PISTON_PROXY_TARGET || 'http://localhost:2000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Browser calls same-origin /piston/...; Vite forwards to the Piston
        // container so there is no cross-origin (CORS) problem in development.
        '/piston': {
          target: pistonTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/piston/, ''),
        },
      },
    },
  };
});
