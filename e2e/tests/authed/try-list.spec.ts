import { test, expect } from '@playwright/test';

import { E2E_BOARD_ID } from '../../constants';
import { TryListPage } from '../../pages/try-list.page';

test.describe('Tryリストページ', () => {
  test('Tryリストタブに切り替えられること', async ({ page }) => {
    const tryListPage = new TryListPage(page);
    await tryListPage.goto();

    await expect(tryListPage.tryListTab).toHaveAttribute('aria-selected', 'true');
  });

  test('ステータスフィルターが表示されること', async ({ page }) => {
    const tryListPage = new TryListPage(page);
    await tryListPage.goto();

    await expect(tryListPage.getStatusFilterCheckbox('未対応')).toBeVisible();
    await expect(tryListPage.getStatusFilterCheckbox('対応中')).toBeVisible();
    await expect(tryListPage.getStatusFilterCheckbox('完了')).toBeVisible();
    await expect(tryListPage.getStatusFilterCheckbox('対応不要')).toBeVisible();
  });

  test('Tryアイテムがテーブルに表示されること', async ({ page }) => {
    const tryListPage = new TryListPage(page);
    await tryListPage.goto();

    // デフォルトでは「未対応」と「対応中」のみ表示される
    await expect(tryListPage.getTryItemLink('E2E未対応のTry')).toBeVisible();
    await expect(tryListPage.getTryItemLink('E2E対応中のTry')).toBeVisible();
    // 「完了」はデフォルトで非表示
    await expect(tryListPage.getTryItemLink('E2E完了のTry')).not.toBeVisible();
  });

  test('ステータスでフィルターできること', async ({ page }) => {
    const tryListPage = new TryListPage(page);
    await tryListPage.goto();

    // デフォルトでは「完了」は非表示
    await expect(tryListPage.getTryItemLink('E2E完了のTry')).not.toBeVisible();

    // 「完了」フィルターをオンにする
    await tryListPage.filterByStatus('完了');

    // 「完了」のアイテムが表示される
    await expect(tryListPage.getTryItemLink('E2E完了のTry')).toBeVisible();
  });

  test('Tryアイテムをクリックするとボードページに遷移すること', async ({ page }) => {
    const tryListPage = new TryListPage(page);
    await tryListPage.goto();

    await tryListPage.getTryItemLink('E2E未対応のTry').click();

    await expect(page).toHaveURL(new RegExp(`/boards/${E2E_BOARD_ID}\\?itemId=`));
  });
});
