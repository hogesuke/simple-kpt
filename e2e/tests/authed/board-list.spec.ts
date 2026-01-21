import { test, expect } from '@playwright/test';

import { E2E_BOARD_ID, E2E_BOARD_NAME } from '../../constants';
import { BoardListPage } from '../../pages/board-list.page';

test.describe('ボードリストページ', () => {
  test('ログイン済みユーザーがボードリストを表示できること', async ({ page }) => {
    const boardListPage = new BoardListPage(page);
    await boardListPage.goto();

    await expect(boardListPage.boardListTab).toBeVisible();
    await expect(boardListPage.createBoardButton).toBeVisible();
  });

  test('テストボードがリストに表示されること', async ({ page }) => {
    const boardListPage = new BoardListPage(page);
    await boardListPage.goto();

    await expect(boardListPage.getBoardLink(E2E_BOARD_NAME)).toBeVisible();
  });

  test('ボードをクリックするとボードページに遷移すること', async ({ page }) => {
    const boardListPage = new BoardListPage(page);
    await boardListPage.goto();

    await boardListPage.openBoard(E2E_BOARD_NAME);

    await expect(page).toHaveURL(`/boards/${E2E_BOARD_ID}`);
  });
});
