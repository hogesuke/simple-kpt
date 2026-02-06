import { Locator, Page } from '@playwright/test';

/**
 * ランディングページのPage Object
 */
export class LandingPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly heroDemoButton: Locator;
  readonly bottomDemoButton: Locator;
  readonly startLoginButton: Locator;
  readonly headerLoginButton: Locator;
  readonly featureSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /チームの振り返りを/ });
    this.heroDemoButton = page.getByRole('link', { name: 'デモを試す' }).first();
    this.bottomDemoButton = page.getByRole('link', { name: 'デモを試す' }).last();
    this.startLoginButton = page.getByRole('link', { name: '今すぐ始める' });
    this.headerLoginButton = page.getByRole('button', { name: 'ログイン' });
    this.featureSection = page.getByRole('heading', { name: '主な機能' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickHeroDemo() {
    await this.heroDemoButton.click();
  }

  async clickBottomDemo() {
    await this.heroDemoButton.click();
  }

  async clickStartLogin() {
    await this.startLoginButton.click();
  }

  async clickHeaderLogin() {
    await this.headerLoginButton.click();
  }
}
