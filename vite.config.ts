import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import license from 'rollup-plugin-license';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          charts: ['recharts'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
      plugins: [
        license({
          thirdParty: {
            output: {
              file: fileURLToPath(new URL('./dist/licenses.txt', import.meta.url)),
              encoding: 'utf-8',
            },
          },
        }),
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
    dedupe: ['react', 'react-dom', 'react-i18next'],
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'i18next', 'i18next-browser-languagedetector', 'react-i18next'],
  },
});
