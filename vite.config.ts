import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import license from 'rollup-plugin-license';
import { defineConfig, Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Viteのビルドパイプラインを通さずにテーマ初期化スクリプトを注入するプラグイン
// (index.htmlに直接記述するとビルド時にインライン化されCSP違反になるため)
function injectThemeInitPlugin(): Plugin {
  return {
    name: 'inject-theme-init',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { src: '/theme-init.js' },
          injectTo: 'body-prepend',
        },
      ];
    },
  };
}

/** ライブラリをまとめるチャンクと、そこに含めるパッケージ */
const CHUNK_PACKAGES: Record<string, string[]> = {
  vendor: ['react', 'react-dom', 'react-router'],
  ui: ['lucide-react', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
  forms: ['react-hook-form', 'zod'],
  dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
};

/**
 * モジュールのパスから、含めるチャンクの名前を求める（該当しない場合はundefined）
 */
function findChunkName(id: string): string | undefined {
  const normalizedId = id.replace(/\\/g, '/');
  for (const [chunkName, packages] of Object.entries(CHUNK_PACKAGES)) {
    if (packages.some((name) => normalizedId.includes(`/node_modules/${name}/`))) return chunkName;
  }
  return undefined;
}

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), injectThemeInitPlugin()],
  build: {
    rollupOptions: {
      output: {
        // Vite 8（Rolldown）ではオブジェクト形式に対応していないため、関数形式でチャンクを振り分ける
        manualChunks(id) {
          return findChunkName(id);
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
