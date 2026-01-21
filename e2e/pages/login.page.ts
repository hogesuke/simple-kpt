import { Locator, Page } from '@playwright/test';

/**
 * ログインページのPage Object
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signUpButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('メールアドレス');
    this.passwordInput = page.locator('input#password');
    this.loginButton = page.getByRole('main').getByRole('button', { name: 'ログイン' });
    this.signUpButton = page.getByRole('button', { name: '新規登録' });
    this.forgotPasswordLink = page.getByRole('button', { name: 'パスワードをお忘れですか？' });
    this.errorAlert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
