import { Locator, Page } from '@playwright/test';

/**
 * TryリストページのPage Object
 */
export class TryListPage {
  readonly page: Page;
  readonly tryListTab: Locator;
  readonly tryTable: Locator;
  readonly emptyMessage: Locator;
  readonly statusFilterGroup: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tryListTab = page.getByRole('tab', { name: 'Tryリスト' });
    this.tryTable = page.getByRole('tabpanel').getByRole('table');
    this.emptyMessage = page.getByText('Tryアイテムがありません');
    this.statusFilterGroup = page.getByRole('group', { name: 'ステータスフィルター' });
  }

  async goto() {
    await this.page.goto('/boards');
    await this.tryListTab.click();
  }

  /**
   * ステータスフィルターチェックボックスを取得
   */
  getStatusFilterCheckbox(status: '未対応' | '対応中' | '完了' | '対応不要'): Locator {
    return this.statusFilterGroup.getByRole('checkbox', { name: status });
  }

  /**
   * ステータスでフィルター
   */
  async filterByStatus(status: '未対応' | '対応中' | '完了' | '対応不要') {
    await this.getStatusFilterCheckbox(status).click();
  }

  /**
   * Tryアイテムのリンクを取得
   */
  getTryItemLink(text: string): Locator {
    return this.tryTable.getByRole('link', { name: text });
  }

  /**
   * テーブルの行数を取得
   */
  getTableRows(): Locator {
    return this.tryTable.locator('tbody tr');
  }
}
