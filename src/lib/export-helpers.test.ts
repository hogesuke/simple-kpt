import { describe, expect, it } from 'vitest';

import '@/i18n';

import { getStatusLabels } from '@/types/kpt';

import { generateCSV, generateMarkdown } from './export-helpers';

import type { KptItem } from '@/types/kpt';

const createMockItem = (overrides: Partial<KptItem> = {}): KptItem => ({
  id: 'item-1',
  boardId: 'board-1',
  column: 'keep',
  text: 'テストテキスト',
  position: 1000,
  authorId: 'user-1',
  authorNickname: 'テストユーザー',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T11:00:00.000Z',
  ...overrides,
});

describe('generateMarkdown', () => {
  it('ボード名がタイトルとして出力されること', () => {
    const result = generateMarkdown('テストボード', []);

    expect(result).toContain('# テストボード');
  });

  it('テーブルヘッダーが正しく出力されること', () => {
    const result = generateMarkdown('テストボード', []);

    expect(result).toContain('| カラム | テキスト | 作成者 | 作成日時 | 更新日時 | 投票数 | ステータス | 担当者 | 期日 |');
    expect(result).toContain('|--------|----------|--------|----------|----------|--------|------------|--------|------|');
  });

  it('アイテムがテーブル行として出力されること', () => {
    const items: KptItem[] = [createMockItem()];
    const result = generateMarkdown('テストボード', items);

    expect(result).toContain('| Keep | テストテキスト | テストユーザー |');
  });

  it('アイテムがカラム順（Keep, Problem, Try）でソートされること', () => {
    const items: KptItem[] = [
      createMockItem({ id: '1', column: 'try', text: 'Try' }),
      createMockItem({ id: '2', column: 'keep', text: 'Keep' }),
      createMockItem({ id: '3', column: 'problem', text: 'Problem' }),
    ];
    const result = generateMarkdown('テストボード', items);
    const lines = result.split('\n');
    const dataLines = lines.filter((line) => line.startsWith('| Keep') || line.startsWith('| Problem') || line.startsWith('| Try'));

    expect(dataLines[0]).toContain('Keep');
    expect(dataLines[1]).toContain('Problem');
    expect(dataLines[2]).toContain('Try');
  });

  it('同じカラム内ではpositionでソートされること', () => {
    const items: KptItem[] = [
      createMockItem({ id: '1', column: 'keep', text: 'Third', position: 3000 }),
      createMockItem({ id: '2', column: 'keep', text: 'First', position: 1000 }),
      createMockItem({ id: '3', column: 'keep', text: 'Second', position: 2000 }),
    ];
    const result = generateMarkdown('テストボード', items);
    const lines = result.split('\n');
    const dataLines = lines.filter((line) => line.startsWith('| Keep'));

    expect(dataLines[0]).toContain('First');
    expect(dataLines[1]).toContain('Second');
    expect(dataLines[2]).toContain('Third');
  });

  it('パイプ文字がエスケープされること', () => {
    const items: KptItem[] = [createMockItem({ text: 'テスト|パイプ' })];
    const result = generateMarkdown('テストボード', items);

    expect(result).toContain('テスト\\|パイプ');
  });

  it('改行がスペースに置換されること', () => {
    const items: KptItem[] = [createMockItem({ text: 'テスト\n改行' })];
    const result = generateMarkdown('テストボード', items);

    expect(result).toContain('テスト 改行');
  });

  it('Tryアイテムのステータスが翻訳されて出力されること', () => {
    const items: KptItem[] = [
      createMockItem({
        column: 'try',
        text: 'Tryアイテム',
        status: 'in_progress',
        assigneeNickname: '担当者',
        dueDate: '2024-02-01',
      }),
    ];
    const result = generateMarkdown('テストボード', items);

    expect(result).toContain(getStatusLabels().in_progress);
    expect(result).toContain('担当者');
  });

  it('オプショナルフィールドがない場合は空文字で出力されること', () => {
    const items: KptItem[] = [
      createMockItem({
        authorNickname: null,
        createdAt: undefined,
        updatedAt: undefined,
      }),
    ];
    const result = generateMarkdown('テストボード', items);

    // エラーなく生成されることを確認
    expect(result).toContain('| Keep | テストテキスト |');
  });
});

describe('generateCSV', () => {
  it('ヘッダー行が正しく出力されること', () => {
    const result = generateCSV([]);
    const lines = result.split('\n');

    expect(lines[0]).toBe('カラム,テキスト,作成者,作成日時,更新日時,投票数,ステータス,担当者,期日');
  });

  it('アイテムがCSV行として出力されること', () => {
    const items: KptItem[] = [createMockItem()];
    const result = generateCSV(items);
    const lines = result.split('\n');

    expect(lines[1]).toContain('Keep,テストテキスト,テストユーザー');
  });

  it('アイテムがカラム順（Keep, Problem, Try）でソートされること', () => {
    const items: KptItem[] = [
      createMockItem({ id: '1', column: 'try', text: 'Try' }),
      createMockItem({ id: '2', column: 'keep', text: 'Keep' }),
      createMockItem({ id: '3', column: 'problem', text: 'Problem' }),
    ];
    const result = generateCSV(items);
    const lines = result.split('\n');

    expect(lines[1]).toContain('Keep');
    expect(lines[2]).toContain('Problem');
    expect(lines[3]).toContain('Try');
  });

  it('同じカラム内ではpositionでソートされること', () => {
    const items: KptItem[] = [
      createMockItem({ id: '1', column: 'keep', text: 'Third', position: 3000 }),
      createMockItem({ id: '2', column: 'keep', text: 'First', position: 1000 }),
      createMockItem({ id: '3', column: 'keep', text: 'Second', position: 2000 }),
    ];
    const result = generateCSV(items);
    const lines = result.split('\n');

    expect(lines[1]).toContain('First');
    expect(lines[2]).toContain('Second');
    expect(lines[3]).toContain('Third');
  });

  it('カンマを含むテキストがダブルクォートで囲まれること', () => {
    const items: KptItem[] = [createMockItem({ text: 'テスト,カンマ' })];
    const result = generateCSV(items);

    expect(result).toContain('"テスト,カンマ"');
  });

  it('ダブルクォートを含むテキストがエスケープされること', () => {
    const items: KptItem[] = [createMockItem({ text: 'テスト"クォート' })];
    const result = generateCSV(items);

    expect(result).toContain('"テスト""クォート"');
  });

  it('改行を含むテキストがダブルクォートで囲まれること', () => {
    const items: KptItem[] = [createMockItem({ text: 'テスト\n改行' })];
    const result = generateCSV(items);

    expect(result).toContain('"テスト\n改行"');
  });

  it('Tryアイテムのステータスが翻訳されて出力されること', () => {
    const items: KptItem[] = [
      createMockItem({
        column: 'try',
        text: 'Tryアイテム',
        status: 'done',
      }),
    ];
    const result = generateCSV(items);

    expect(result).toContain(getStatusLabels().done);
  });

  it('オプショナルフィールドがない場合は空文字で出力されること', () => {
    const items: KptItem[] = [
      createMockItem({
        authorNickname: null,
        createdAt: undefined,
        updatedAt: undefined,
        status: null,
        assigneeNickname: null,
        dueDate: null,
      }),
    ];
    const result = generateCSV(items);
    const lines = result.split('\n');

    // エラーなく生成されることを確認
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Keep,テストテキスト');
  });
});
