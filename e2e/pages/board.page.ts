import { Locator, Page } from '@playwright/test';

/**
 * KPTボードページのPage Object
 */
export class BoardPage {
  readonly page: Page;
  readonly keepColumn: Locator;
  readonly problemColumn: Locator;
  readonly tryColumn: Locator;
  readonly addItemInput: Locator;
  readonly addItemButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.keepColumn = page.getByRole('heading', { name: 'Keep' });
    this.problemColumn = page.getByRole('heading', { name: 'Problem' });
    this.tryColumn = page.getByRole('heading', { name: 'Try' });
    this.addItemInput = page.getByPlaceholder('アイテムを追加...');
    this.addItemButton = page.getByRole('button', { name: '送信' });
  }

  async goto(boardId: string) {
    await this.page.goto(`/boards/${boardId}`);
  }

  /**
   * カラムを選択
   */
  async selectColumn(column: 'keep' | 'problem' | 'try') {
    const columnLabel = column === 'keep' ? 'Keep' : column === 'problem' ? 'Problem' : 'Try';
    await this.page.getByRole('group', { name: 'カラム選択' }).getByRole('button', { name: columnLabel }).click();
  }

  /**
   * アイテムを追加
   */
  async addItem(text: string, column?: 'keep' | 'problem' | 'try') {
    // ページの読み込み完了を待つ
    await this.addItemInput.waitFor({ state: 'visible' });

    if (column) {
      await this.selectColumn(column);
    }
    await this.addItemInput.fill(text);
    await this.addItemButton.click();
  }

  /**
   * カード要素を取得
   */
  getCard(text: string): Locator {
    return this.page.getByText(text);
  }
}
