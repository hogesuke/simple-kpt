import { test, expect } from '@playwright/test';

import { E2E_BOARD_ID } from '../../constants';
import { BoardPage } from '../../pages/board.page';

test.describe('ボードページ', () => {
  test('KPTボードの3つのカラムが表示されること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await expect(boardPage.keepColumn).toBeVisible();
    await expect(boardPage.problemColumn).toBeVisible();
    await expect(boardPage.tryColumn).toBeVisible();
  });

  test('アイテム追加フォームが表示されること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    // カラムが表示されるまで待つ
    await expect(boardPage.keepColumn).toBeVisible();

    await expect(boardPage.addItemInput).toBeVisible();
    await expect(boardPage.addItemButton).toBeVisible();
  });

  test('新しいアイテムを追加できること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    const testText = `E2Eテストアイテム ${Date.now()}`;
    await boardPage.addItem(testText);

    await expect(boardPage.getCard(testText)).toBeVisible();
  });

  test('Keepカラムにアイテムを追加できること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    const testText = `Keep E2E ${Date.now()}`;
    await boardPage.addItem(testText, 'keep');

    await expect(boardPage.getCard(testText)).toBeVisible();
  });

  test('Problemカラムにアイテムを追加できること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    const testText = `Problem E2E ${Date.now()}`;
    await boardPage.addItem(testText, 'problem');

    await expect(boardPage.getCard(testText)).toBeVisible();
  });

  test('Tryカラムにアイテムを追加できること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    const testText = `Try E2E ${Date.now()}`;
    await boardPage.addItem(testText, 'try');

    await expect(boardPage.getCard(testText)).toBeVisible();
  });
});
