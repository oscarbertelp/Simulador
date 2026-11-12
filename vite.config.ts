import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isPagesBuild = process.env.BUILD_PAGES === 'true';

  return {
    base: './',
    plugins: [
      {
        name: 'lorentz-vite-entry',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return html
              .replace(/<!-- VITE_STRIP_START -->[\s\S]*?<!-- VITE_STRIP_END -->/g, '')
              .replace(
                /<!-- VITE_ENTRY_START -->[\s\S]*?<!-- VITE_ENTRY_END -->/,
                '<script type="module" src="/src/main.tsx"></script>'
              );
          },
        },
      },
      react(),
      tailwindcss(),
    ],
    build: isPagesBuild
      ? {
          outDir: 'docs',
          emptyOutDir: true,
          rollupOptions: {
            output: {
              entryFileNames: 'assets/app.js',
              chunkFileNames: 'assets/[name].js',
              assetFileNames: (assetInfo) => {
                const name = assetInfo.names?.[0] ?? '';
                if (name.endsWith('.css')) {
                  return 'assets/app.css';
                }
                return 'assets/[name]-[hash][extname]';
              },
            },
          },
        }
      : undefined,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
