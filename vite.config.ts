import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled when the DISABLE_HMR env var is set to true.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    optimizeDeps: {
      // Only crawl from the browser entry point — prevents Vite from scanning
      // server.ts and pulling in Node.js-only packages (ws, @supabase/supabase-js, sharp).
      entries: ['index.html'],
      // Explicitly exclude Node.js-only packages that have native .node binaries.
      exclude: ['ws', 'bufferutil', 'utf-8-validate', 'sharp'],
    },
    // Prevent Vite from ever serving native Node.js addon files (.node) as assets.
    assetsInclude: [],
    // Tell Vite these are server-only externals — never bundle them for the browser.
    build: {
      rollupOptions: {
        external: ['ws', 'bufferutil', 'utf-8-validate', 'sharp'],
      },
    },
  };
});
