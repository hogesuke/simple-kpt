import { test, expect } from '@playwright/test';

import { LandingPage } from '../../pages/landing.page';

test.describe('ランディングページ', () => {
  test('ページが正常に表示されること', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await expect(landingPage.heading).toBeVisible();
    await expect(landingPage.heroDemoButton).toBeVisible();
    await expect(landingPage.startButton).toBeVisible();
    await expect(landingPage.featureSection).toBeVisible();
  });

  test('ヒーローセクションのデモボタンをクリックするとデモページに遷移すること', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.clickHeroDemo();

    await expect(page).toHaveURL('/demo');
  });

  test('ページ下部のデモボタンをクリックするとデモページに遷移すること', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.clickBottomDemo();

    await expect(page).toHaveURL('/demo');
  });

  test('ヒーローセクションの今すぐ始めるボタンをクリックするとボード作成ページに遷移すること', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.clickStart();

    await expect(page).toHaveURL('/new');
  });

  test('ページタイトルが正しいこと', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await expect(page).toHaveTitle('Simple KPT');
  });
});
