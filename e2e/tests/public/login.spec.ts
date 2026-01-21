import { test, expect } from '@playwright/test';

import { LoginPage } from '../../pages/login.page';

test.describe('ログインページ', () => {
  test('ページが正しく表示されること', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.signUpButton).toBeVisible();
  });

  test('無効な認証情報でログインするとエラーが表示されること', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');

    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText('メールアドレスまたはパスワードが正しくありません');
  });

  test('メールアドレスが空の場合はバリデーションエラーが表示されること', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill('password');
    await loginPage.loginButton.click();

    await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible();
  });

  test('パスワードをお忘れですかリンクが機能すること', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.forgotPasswordLink.click();

    await expect(page.getByText('パスワードリセット用のメールを送信')).toBeVisible();
  });

  test('新規登録ボタンが機能すること', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signUpButton.click();

    await expect(page.getByText('アカウント作成')).toBeVisible();
  });
});
