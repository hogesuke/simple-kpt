import { test, expect } from '@playwright/test';

import { DemoPage } from '../../pages/demo.page';

test.describe('デモページ', () => {
  test('KPTボードの3つのカラムが表示されること', async ({ page }) => {
    const demoPage = new DemoPage(page);
    await demoPage.goto();

    await expect(demoPage.keepColumn).toBeVisible();
    await expect(demoPage.problemColumn).toBeVisible();
    await expect(demoPage.tryColumn).toBeVisible();
  });

  test('カード追加フォームが表示されること', async ({ page }) => {
    const demoPage = new DemoPage(page);
    await demoPage.goto();

    await expect(demoPage.addItemInput).toBeVisible();
    await expect(demoPage.addItemButton).toBeVisible();
  });

  test('新しいカードを追加できること', async ({ page }) => {
    const demoPage = new DemoPage(page);
    await demoPage.goto();

    const testText = `テストカード ${Date.now()}`;
    await demoPage.addItem(testText);

    await expect(demoPage.getCard(testText)).toBeVisible();
  });

  test('カラムを選択して追加できること', async ({ page }) => {
    const demoPage = new DemoPage(page);
    await demoPage.goto();

    const testText = `Problemカード ${Date.now()}`;
    await demoPage.addItem(testText, 'problem');

    await expect(demoPage.getCard(testText)).toBeVisible();
  });

  test('カードをクリックすると詳細パネルが開くこと', async ({ page }) => {
    const demoPage = new DemoPage(page);
    await demoPage.goto();

    // カードを追加
    const testText = `詳細テスト ${Date.now()}`;
    await demoPage.addItem(testText);

    await demoPage.getCard(testText).click();

    await expect(page.getByRole('dialog', { name: 'カード詳細' })).toBeVisible();
  });

  test('詳細パネルを閉じることができること', async ({ page }) => {
    const demoPage = new DemoPage(page);
    await demoPage.goto();

    // カードを追加してクリック
    const testText = `閉じるテスト ${Date.now()}`;
    await demoPage.addItem(testText);
    await demoPage.getCard(testText).click();

    await page.getByRole('button', { name: '閉じる', exact: true }).click();

    await expect(page.getByRole('dialog', { name: 'カード詳細' })).not.toBeVisible();
  });
});
