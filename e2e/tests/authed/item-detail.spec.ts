import { test, expect } from '@playwright/test';

import { E2E_BOARD_ID } from '../../constants';
import { BoardPage } from '../../pages/board.page';
import { ItemDetailPanelPage } from '../../pages/item-detail-panel.page';

test.describe('アイテム詳細パネル', () => {
  test('カードをクリックすると詳細パネルが開くこと', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await boardPage.getCard('E2E未対応のTry').click();

    await expect(detailPanel.panel).toBeVisible();
  });

  test('閉じるボタンでパネルを閉じられること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await boardPage.getCard('E2E未対応のTry').click();
    await expect(detailPanel.panel).toBeVisible();

    await detailPanel.close();

    await expect(detailPanel.panel).not.toBeVisible();
  });

  test('編集ボタンをクリックすると編集モードになること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await boardPage.getCard('E2E未対応のTry').click();
    await detailPanel.startEdit();

    await expect(detailPanel.textarea).toBeVisible();
    await expect(detailPanel.saveButton).toBeVisible();
    await expect(detailPanel.cancelButton).toBeVisible();
  });

  test('編集をキャンセルできること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await boardPage.getCard('E2E未対応のTry').click();
    await detailPanel.startEdit();
    await detailPanel.textarea.fill('変更したテキスト');
    await detailPanel.cancelEdit();

    await expect(detailPanel.textarea).not.toBeVisible();
    await expect(detailPanel.editButton).toBeVisible();
  });

  test('テキストを編集して保存できること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    const originalText = 'E2E編集テスト用Keep';
    await boardPage.getCard(originalText).click();

    // パネルが開くまで待つ
    await expect(detailPanel.panel).toBeVisible();

    const newText = `E2E編集テスト用Keep（編集済み）`;
    await detailPanel.editText(newText);

    await expect(detailPanel.getItemText(newText)).toBeVisible();

    // テストデータをリセット
    await detailPanel.editText(originalText);
  });
});

test.describe('アイテム詳細パネル - Try専用機能', () => {
  test('Tryアイテムのステータスを変更できること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await boardPage.getCard('E2Eステータス変更用Try').click();
    await expect(detailPanel.panel).toBeVisible();

    await detailPanel.changeStatus('対応中');

    await expect(detailPanel.getStatusText()).toContainText('対応中');

    // テストデータをリセット
    await detailPanel.changeStatus('未対応');
  });

  test('Tryアイテムの担当者を変更できること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await boardPage.getCard('E2E担当者変更用Try').click();
    await expect(detailPanel.panel).toBeVisible();

    await detailPanel.changeAssignee('テストユーザー1');

    await expect(detailPanel.getAssigneeText()).toContainText('テストユーザー1');

    // テストデータをリセット
    await detailPanel.changeAssignee('未設定');
  });

  test('ステータスを「対応不要」にすると担当者と期日が無効になること', async ({ page }) => {
    const boardPage = new BoardPage(page);
    const detailPanel = new ItemDetailPanelPage(page);
    await boardPage.goto(E2E_BOARD_ID);

    await boardPage.getCard('E2E対応不要テスト用Try').click();
    await expect(detailPanel.panel).toBeVisible();

    await detailPanel.changeStatus('対応不要');

    // 担当者と期日が無効になっていることを確認
    await expect(detailPanel.assigneeSelect).toBeDisabled();
    await expect(detailPanel.dueDateButton).toBeDisabled();

    // テストデータをリセット
    await detailPanel.changeStatus('未対応');
  });
});
