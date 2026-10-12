import { Locator, Page } from '@playwright/test';

/**
 * ボードを始めるページのPage Object
 */
export class NewRoomPage {
  readonly page: Page;
  readonly newTab: Locator;
  readonly resumeTab: Locator;
  readonly boardNameInput: Locator;
  readonly nicknameInput: Locator;
  readonly createButton: Locator;
  readonly fileInput: Locator;
  readonly createFromFileButton: Locator;
  readonly fileError: Locator;
  readonly recentBoards: Locator;
  readonly shareDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTab = page.getByRole('tab', { name: '新しく始める' });
    this.resumeTab = page.getByRole('tab', { name: '続きから始める' });
    this.boardNameInput = page.getByLabel('ボード名');
    this.nicknameInput = page.getByLabel('ニックネーム');
    this.createButton = page.getByRole('button', { name: '作成する', exact: true });
    this.fileInput = page.locator('#board-file');
    this.createFromFileButton = page.getByRole('button', { name: 'このファイルから作成する' });
    this.fileError = page.getByRole('alert');
    this.recentBoards = page.getByRole('list', { name: '最近参加したボード' });
    this.shareDialog = page.getByRole('dialog', { name: 'ボードを作成しました' });
  }

  async goto() {
    await this.page.goto('/new');
  }

  async create(boardName: string, nickname: string) {
    await this.boardNameInput.fill(boardName);
    await this.nicknameInput.fill(nickname);
    await this.createButton.click();
  }

  /** ボード作成直後に表示される招待URLの案内を閉じる */
  async closeShareDialog() {
    await this.shareDialog.getByRole('button', { name: '閉じる' }).first().click();
  }
}
