import { fileURLToPath, URL } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@storybook-mocks': fileURLToPath(new URL('./mocks', import.meta.url)),
    };
    // Storybook用のダミー環境変数（実際のSupabase接続は行わない）
    config.define = {
      ...config.define,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://dummy.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('dummy-anon-key'),
    };
    return config;
  },
};
export default config;
