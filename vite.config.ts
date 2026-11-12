/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Dev-only: point the /piston proxy at a remote Piston (e.g. an AWS test box) by
  // setting VITE_PISTON_PROXY_TARGET in .env.local (gitignored). Defaults to the local
  // Piston container so it keeps any real instance IP out of the committed config.
  const env = loadEnv(mode, '.', '');
  const pistonTarget = env.VITE_PISTON_PROXY_TARGET || 'http://localhost:2000';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          /*
           * Split the two things that change on a different clock from app code, so a
           * normal code deploy doesn't force returning visitors to re-download them.
           *
           * `catalog` is src/data/problems.json (~110 kB raw) - it only changes when
           * problems are added. `vendor` is the libraries every route needs, which only
           * change on a dependency bump. Everything else stays in the entry chunk,
           * which is what a typical commit actually touches.
           *
           * `problem-runtime` is the other half of the catalog (starter code, hidden
           * harnesses, test cases - ~380 kB raw). It is only ever reached through a
           * dynamic import from the session and replay pages, so Rollup would give it
           * its own chunk regardless; naming it keeps that visible in the build output
           * and stops it being merged into a route chunk.
           *
           * VENDOR_CORE is an explicit allow-list rather than a blanket
           * `node_modules -> vendor` rule, which would be a regression: it would drag
           * route-only libraries (react-markdown and its micromark tree, ~159 kB) back
           * into the initial download and undo the route splitting in App.tsx. Anything
           * not listed here is left to Rollup, which lands it in the lazy chunk that
           * imports it. Paths are matched with trailing slashes so `react/` cannot also
           * match `react-markdown/`.
           */
          manualChunks(id) {
            const path = id.replace(/\\/g, '/');
            if (path.includes('src/data/problems.json')) return 'catalog';
            if (path.includes('src/data/problem-runtime.json')) return 'problem-runtime';
            const VENDOR_CORE = [
              'node_modules/react/',
              'node_modules/react-dom/',
              'node_modules/scheduler/',
              'node_modules/react-router/',
              'node_modules/react-router-dom/',
              'node_modules/zustand/',
              'node_modules/@supabase/',
            ];
            if (VENDOR_CORE.some((pkg) => path.includes(pkg))) return 'vendor';
          },
        },
      },
    },
    // Unit-test layer (Vitest)
    test: {
      environment: 'node',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.d.ts', 'src/main.tsx'],
      },
    },
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
