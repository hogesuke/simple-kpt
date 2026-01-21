import { Locator, Page } from '@playwright/test';

/**
 * ボードリストページのPage Object
 */
export class BoardListPage {
  readonly page: Page;
  readonly boardListTab: Locator;
  readonly tryListTab: Locator;
  readonly createBoardButton: Locator;
  readonly boardTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.boardListTab = page.getByRole('tab', { name: 'ボードリスト' });
    this.tryListTab = page.getByRole('tab', { name: 'Tryリスト' });
    this.createBoardButton = page.getByRole('button', { name: 'ボードを作成' });
    this.boardTable = page.getByRole('table');
  }

  async goto() {
    await this.page.goto('/boards');
  }

  /**
   * ボード名でボードリンクを取得
   */
  getBoardLink(name: string): Locator {
    return this.page.getByRole('link', { name });
  }

  /**
   * ボードをクリックして詳細ページに遷移
   */
  async openBoard(name: string) {
    await this.getBoardLink(name).click();
  }
}
