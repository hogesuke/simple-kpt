import { writeFileSync } from 'node:fs';

import { test, expect } from '@playwright/test';

import { NewRoomPage } from '../../pages/new-room.page';

const BOARD_FILE = {
  format: 'simple-kpt-board',
  version: 1,
  exportedAt: '2026-10-11T00:00:00.000Z',
  board: { name: '前回の振り返り' },
  items: [
    { column: 'keep', text: '前回のKeep', position: 1000 },
    { column: 'try', text: '前回のTry', position: 1000, status: 'in_progress' },
  ],
};

test.describe('ボードを始めるページ', () => {
  test('ボードを作成するとボード画面に遷移すること', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('E2Eボード', 'E2Eユーザー');

    await expect(page).toHaveURL(/\/r\/[A-Za-z0-9_-]+#[A-Za-z0-9_-]+$/);
    await newRoomPage.closeShareDialog();
    await expect(page.getByRole('heading', { name: 'E2Eボード' })).toBeVisible();
    await expect(page.getByRole('button', { name: '参加者一覧を開く（1人が参加中）' })).toBeVisible();
  });

  test('作成したボードにカードを追加できること', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('E2Eボード', 'E2Eユーザー');
    await newRoomPage.closeShareDialog();

    const input = page.getByRole('textbox', { name: 'アイテムを追加' });
    await input.fill('E2Eのカード');
    await input.press('Enter');

    await expect(page.getByText('E2Eのカード')).toBeVisible();
  });

  test('再開用ファイルから始めるとカードが引き継がれること', async ({ page }, testInfo) => {
    const filePath = testInfo.outputPath('board.json');
    writeFileSync(filePath, JSON.stringify(BOARD_FILE));

    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.resumeTab.click();
    await newRoomPage.fileInput.setInputFiles(filePath);

    await expect(newRoomPage.boardNameInput).toHaveValue('前回の振り返り');
    await expect(page.getByText('2件のカード')).toBeVisible();

    await newRoomPage.nicknameInput.fill('E2Eユーザー');
    await newRoomPage.createFromFileButton.click();
    await newRoomPage.closeShareDialog();

    await expect(page.getByText('前回のKeep')).toBeVisible();
    await expect(page.getByText('前回のTry')).toBeVisible();
  });

  test('参加者一覧に自分が表示され、クリックすると自分のカードに絞り込まれること', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('E2Eボード', 'E2Eユーザー');
    await newRoomPage.closeShareDialog();

    await page.getByRole('button', { name: '参加者一覧を開く（1人が参加中）' }).click();
    const me = page.getByRole('button', { name: /E2Eユーザー/ });
    await expect(me).toContainText('（あなた）');
    await me.click();

    await expect(page.getByRole('button', { name: 'フィルターを解除' })).toBeVisible();
  });

  test('ボード作成直後に招待URLの案内が表示されること', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('E2Eボード', 'E2Eユーザー');

    await expect(newRoomPage.shareDialog).toBeVisible();
    await expect(newRoomPage.shareDialog.getByLabel('招待URL')).toHaveValue(page.url());
  });

  test('リロードすると招待URLの案内が表示されないこと', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('E2Eボード', 'E2Eユーザー');
    await newRoomPage.closeShareDialog();

    await page.reload();

    await expect(page.getByRole('button', { name: '参加者一覧を開く（1人が参加中）' })).toBeVisible();
    await expect(newRoomPage.shareDialog).toBeHidden();
  });

  test('招待URLから参加した場合は招待URLの案内が表示されないこと', async ({ page, browser }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('E2Eボード', 'E2Eユーザー');

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(page.url());
    await guestPage.getByLabel('ニックネーム').fill('ゲスト');
    await guestPage.getByRole('button', { name: '参加する' }).click();

    await expect(guestPage.getByRole('button', { name: /参加者一覧を開く/ })).toBeVisible();
    await expect(guestPage.getByRole('dialog', { name: 'ボードを作成しました' })).toBeHidden();
    await guestContext.close();
  });

  test('不正なファイルを選択するとエラーが表示されること', async ({ page }, testInfo) => {
    const filePath = testInfo.outputPath('invalid.json');
    writeFileSync(filePath, JSON.stringify({ hello: 'world' }));

    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.resumeTab.click();
    await newRoomPage.fileInput.setInputFiles(filePath);

    await expect(newRoomPage.fileError).toHaveText('Simple KPTのボードファイルとして読み込めませんでした');
  });

  test('参加したボードが最近参加したボードに表示され、同じURLで開き直せること', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('再開するボード', 'E2Eユーザー');
    await newRoomPage.closeShareDialog();
    const roomUrl = page.url();

    const input = page.getByRole('textbox', { name: 'アイテムを追加' });
    await input.fill('前回のカード');
    await input.press('Enter');
    await expect(page.getByText('前回のカード')).toBeVisible();

    // 保存待ちの変更を保存させるため、別のページに移動する
    await newRoomPage.goto();
    await newRoomPage.resumeTab.click();
    await newRoomPage.recentBoards.getByRole('link', { name: '再開するボードを開く' }).click();

    await expect(page).toHaveURL(roomUrl);
    await expect(page.getByText('前回のカード')).toBeVisible();
  });

  test('再開用ファイルから始めると、自分のカードの作成者名が入力したニックネームになること', async ({ page }, testInfo) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    // ファイルを書き出したのと同じ端末であることを再現するため、ユーザーIDを固定する
    await page.evaluate(() => localStorage.setItem('simple-kpt:user-id', 'e2e-user'));

    const filePath = testInfo.outputPath('my-board.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        ...BOARD_FILE,
        items: [
          { column: 'keep', text: '自分のカード', position: 1000, authorId: 'e2e-user', authorNickname: '古い名前' },
          { column: 'keep', text: '他の人のカード', position: 2000, authorId: 'other-user', authorNickname: '他の人' },
        ],
      })
    );

    await newRoomPage.resumeTab.click();
    await newRoomPage.fileInput.setInputFiles(filePath);
    await newRoomPage.nicknameInput.fill('新しい名前');
    await newRoomPage.createFromFileButton.click();
    await newRoomPage.closeShareDialog();

    await expect(page.getByText('自分のカード')).toBeVisible();
    await expect(page.getByText('古い名前')).toHaveCount(0);
    await expect(page.getByText('他の人', { exact: true })).toBeVisible();
  });

  test('別の端末で書き出したファイルでも、ファイル内の自分を選ぶと自分のカードとして引き継がれること', async ({ page }, testInfo) => {
    const filePath = testInfo.outputPath('other-device.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        ...BOARD_FILE,
        items: [
          { column: 'keep', text: '山田のカード', position: 1000, authorId: 'old-device-yamada', authorNickname: '山田' },
          { column: 'keep', text: '佐藤のカード', position: 2000, authorId: 'old-device-sato', authorNickname: '佐藤' },
        ],
      })
    );

    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.resumeTab.click();
    await newRoomPage.fileInput.setInputFiles(filePath);

    const selfGroup = page.getByRole('group', { name: 'このファイルの中で、あなたはどれですか？（任意）' });
    await expect(selfGroup.getByRole('radio')).toHaveCount(3);
    await selfGroup.getByText('山田', { exact: true }).click();
    await newRoomPage.nicknameInput.fill('山田太郎');
    await newRoomPage.createFromFileButton.click();
    await newRoomPage.closeShareDialog();

    // 引き継いだカードの作成者名が今のニックネームになり、他の人のカードはそのまま
    await expect(page.getByText('山田のカード')).toBeVisible();
    await expect(page.getByText('山田太郎')).toBeVisible();
    await expect(page.getByText('佐藤', { exact: true })).toBeVisible();
  });

  test('同じ端末で書き出したファイルでは、ファイル内の自分を選ぶ欄が表示されないこと', async ({ page }, testInfo) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await page.evaluate(() => localStorage.setItem('simple-kpt:user-id', 'e2e-user'));

    const filePath = testInfo.outputPath('same-device.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        ...BOARD_FILE,
        items: [{ column: 'keep', text: '自分のカード', position: 1000, authorId: 'e2e-user', authorNickname: '自分' }],
      })
    );

    await newRoomPage.resumeTab.click();
    await newRoomPage.fileInput.setInputFiles(filePath);

    await expect(page.getByText('2件のカード').or(page.getByText('1件のカード'))).toBeVisible();
    await expect(page.getByRole('group', { name: 'このファイルの中で、あなたはどれですか？（任意）' })).toHaveCount(0);
  });

  test('別のボードでニックネームを変えた後に開き直すと、自分のカードの作成者名が新しい名前になること', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('前のボード', '前の名前');
    await newRoomPage.closeShareDialog();
    const input = page.getByRole('textbox', { name: 'アイテムを追加' });
    await input.fill('前のカード');
    await input.press('Enter');
    await expect(page.getByText('前の名前')).toBeVisible();

    // 別のボードを新しい名前で作成する（端末に保存したニックネームが変わる）
    await newRoomPage.goto();
    await newRoomPage.create('次のボード', '次の名前');
    await newRoomPage.closeShareDialog();

    await newRoomPage.goto();
    await newRoomPage.resumeTab.click();
    await newRoomPage.recentBoards.getByRole('link', { name: '前のボードを開く' }).click();

    await expect(page.getByText('前のカード')).toBeVisible();
    await expect(page.getByText('次の名前')).toBeVisible();
    await expect(page.getByText('前の名前')).toHaveCount(0);
  });

  test('最近参加したボードをこの端末から削除できること', async ({ page }) => {
    const newRoomPage = new NewRoomPage(page);
    await newRoomPage.goto();
    await newRoomPage.create('削除するボード', 'E2Eユーザー');
    await newRoomPage.closeShareDialog();

    await newRoomPage.goto();
    await newRoomPage.resumeTab.click();
    await newRoomPage.recentBoards.getByRole('button', { name: '削除するボードをこの端末から削除' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '削除する' }).click();

    await expect(page.getByText('この端末で参加したボードはまだありません。')).toBeVisible();
  });

  test('URLの鍵が欠けている場合はエラーが表示されること', async ({ page }) => {
    await page.goto('/r/abcdefghijklmnopqrstuv');

    await expect(page.getByText('ルームのURLが正しくありません。共有されたURLをそのまま開いてください。')).toBeVisible();
  });
});
