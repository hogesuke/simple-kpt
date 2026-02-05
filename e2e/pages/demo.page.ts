import { Locator, Page } from '@playwright/test';

/**
 * デモページのPage Object
 */
export class DemoPage {
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
    this.addItemInput = page.getByPlaceholder('アイテムを追加');
    this.addItemButton = page.getByRole('button', { name: '送信' });
  }

  async goto() {
    await this.page.goto('/demo');
  }

  async selectColumn(column: 'keep' | 'problem' | 'try') {
    // ColumnSelectorはRadioGroupを使用しているが、RadioGroupItemはsr-onlyなのでラベルテキストをクリック
    await this.page.locator(`label:has(#column-${column})`).click();
  }

  async addItem(text: string, column?: 'keep' | 'problem' | 'try') {
    if (column) {
      await this.selectColumn(column);
    }
    await this.addItemInput.fill(text);
    await this.addItemButton.click();
  }

  getCard(text: string): Locator {
    return this.page.getByText(text);
  }
}
