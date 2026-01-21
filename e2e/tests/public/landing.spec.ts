import { test, expect } from '@playwright/test';

import { LandingPage } from '../../pages/landing.page';

test.describe('ランディングページ', () => {
  test('ページが正常に表示されること', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await expect(landingPage.heading).toBeVisible();
    await expect(landingPage.heroDemoButton).toBeVisible();
    await expect(landingPage.startLoginButton).toBeVisible();
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

  test('ヒーローセクションのログインボタンをクリックするとログインページに遷移すること', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.clickStartLogin();

    await expect(page).toHaveURL('/login');
  });

  test('ヘッダーのログインボタンをクリックするとログインページに遷移すること', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.clickHeaderLogin();

    await expect(page).toHaveURL('/login');
  });

  test('ページタイトルが正しいこと', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await expect(page).toHaveTitle('Simple KPT');
  });
});
