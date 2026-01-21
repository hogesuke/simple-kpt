import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 認証セットアップ
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // 認証不要ページのテスト（tests/public/配下）
    {
      name: 'public',
      testMatch: /tests\/public\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // 認証が必要なページのテスト（tests/authed/配下）
    {
      name: 'authed',
      testMatch: /tests\/authed\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
