import { Locator, Page } from '@playwright/test';

/**
 * ランディングページのPage Object
 */
export class LandingPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly heroDemoButton: Locator;
  readonly bottomDemoButton: Locator;
  readonly startButton: Locator;
  readonly featureSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /チームの振り返りを/ });
    this.heroDemoButton = page.getByRole('link', { name: 'デモを試す' }).first();
    this.bottomDemoButton = page.getByRole('link', { name: 'デモを試す' }).last();
    this.startButton = page.getByRole('link', { name: '今すぐ始める' }).first();
    this.featureSection = page.getByRole('heading', { name: '特徴' });
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

  async clickStart() {
    await this.startButton.click();
  }
}
