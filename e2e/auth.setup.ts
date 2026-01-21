import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

/**
 * 認証セットアップ
 * テスト実行前にログインして認証状態を保存する
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  // seed.sqlのテストユーザーでログイン
  await page.getByLabel('メールアドレス').fill('test1@example.com');
  await page.locator('input#password').fill('password');
  await page.getByRole('main').getByRole('button', { name: 'ログイン' }).click();

  await expect(page).toHaveURL('/boards');

  // 認証状態を保存
  await page.context().storageState({ path: authFile });
});
