import { Locator, Page } from '@playwright/test';

/**
 * アイテム詳細パネルのPage Object
 */
export class ItemDetailPanelPage {
  readonly page: Page;
  readonly panel: Locator;
  readonly closeButton: Locator;
  readonly editButton: Locator;
  readonly textarea: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Try専用フィールド
  readonly statusSelect: Locator;
  readonly assigneeSelect: Locator;
  readonly dueDateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.getByRole('dialog', { name: 'カード詳細' });
    this.closeButton = this.panel.getByRole('button', { name: '閉じる' });
    this.editButton = this.panel.getByRole('button', { name: '編集' });
    this.textarea = this.panel.getByRole('textbox');
    this.saveButton = this.panel.getByRole('button', { name: '保存' });
    this.cancelButton = this.panel.getByRole('button', { name: 'キャンセル' });

    // Try専用フィールド
    this.statusSelect = this.panel.getByRole('combobox').first();
    this.assigneeSelect = this.panel.getByRole('combobox').nth(1);
    this.dueDateButton = this.panel.getByRole('button', { name: /未設定|\d{4}\/\d{2}\/\d{2}/ }).last();
  }

  /**
   * パネルを閉じる
   */
  async close() {
    await this.closeButton.click();
  }

  /**
   * テキスト編集を開始
   */
  async startEdit() {
    await this.editButton.click();
  }

  /**
   * テキストを編集して保存
   */
  async editText(newText: string) {
    await this.startEdit();
    await this.textarea.fill(newText);
    // 保存ボタンが有効になるのを待つ
    await this.saveButton.waitFor({ state: 'visible' });
    await this.saveButton.click();
    // 保存完了後、編集ボタンが再表示されるのを待つ
    await this.editButton.waitFor({ state: 'visible' });
  }

  /**
   * 編集をキャンセル
   */
  async cancelEdit() {
    await this.cancelButton.click();
  }

  /**
   * ステータスを変更
   */
  async changeStatus(status: '未対応' | '対応中' | '完了' | '対応不要') {
    await this.statusSelect.click();
    await this.page.getByRole('option', { name: status }).click();
  }

  /**
   * 担当者を変更
   */
  async changeAssignee(assigneeName: string) {
    await this.assigneeSelect.click();
    await this.page.getByRole('option', { name: assigneeName }).click();
  }

  /**
   * 期日を設定（今日から指定日数後）
   */
  async setDueDate(dayOfMonth: number) {
    await this.dueDateButton.click();
    await this.page.getByRole('gridcell', { name: String(dayOfMonth), exact: true }).click();
  }

  /**
   * 期日をクリア
   */
  async clearDueDate() {
    await this.dueDateButton.click();
    await this.page.getByRole('button', { name: '期日をクリア' }).click();
  }

  /**
   * 現在のステータス表示テキストを取得
   */
  getStatusText(): Locator {
    return this.statusSelect;
  }

  /**
   * 現在の担当者表示テキストを取得
   */
  getAssigneeText(): Locator {
    return this.assigneeSelect;
  }

  /**
   * アイテムのテキスト表示を取得
   */
  getItemText(text: string): Locator {
    return this.panel.getByText(text);
  }
}
