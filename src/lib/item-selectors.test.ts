import { describe, expect, it } from 'vitest';

import { selectActiveItem, selectItemsByColumn } from './item-selectors';

import type { KptItem } from '@/types/kpt';

describe('selectItemsByColumn', () => {
  const mockItems: KptItem[] = [
    {
      id: '1',
      boardId: 'board-1',
      column: 'keep',
      text: 'Keep item 1',
      position: 1000,
      authorId: 'user-1',
      authorNickname: 'User 1',
    },
    {
      id: '2',
      boardId: 'board-1',
      column: 'problem',
      text: 'Problem item 1',
      position: 1000,
      authorId: 'user-1',
      authorNickname: 'User 1',
    },
    {
      id: '3',
      boardId: 'board-1',
      column: 'try',
      text: 'Try item 1',
      position: 1000,
      authorId: 'user-2',
      authorNickname: 'User 2',
    },
    {
      id: '4',
      boardId: 'board-1',
      column: 'keep',
      text: 'Keep item 2',
      position: 2000,
      authorId: 'user-2',
      authorNickname: 'User 2',
    },
  ];

  it('アイテムがカラムごとにグループ化されること', () => {
    const result = selectItemsByColumn(mockItems, ['keep', 'problem', 'try']);

    expect(result.keep).toHaveLength(2);
    expect(result.problem).toHaveLength(1);
    expect(result.try).toHaveLength(1);
    expect(result.keep[0].id).toBe('1');
    expect(result.keep[1].id).toBe('4');
    expect(result.problem[0].id).toBe('2');
    expect(result.try[0].id).toBe('3');
  });

  it('空の配列を渡した場合、すべてのカラムが空配列になること', () => {
    const result = selectItemsByColumn([], ['keep', 'problem', 'try']);

    expect(result.keep).toEqual([]);
    expect(result.problem).toEqual([]);
    expect(result.try).toEqual([]);
  });

  it('特定のカラムにアイテムがない場合、そのカラムは空配列になること', () => {
    const itemsWithoutProblem: KptItem[] = [
      {
        id: '1',
        boardId: 'board-1',
        column: 'keep',
        text: 'Keep item',
        position: 1000,
        authorId: 'user-1',
        authorNickname: 'User 1',
      },
      {
        id: '2',
        boardId: 'board-1',
        column: 'try',
        text: 'Try item',
        position: 1000,
        authorId: 'user-1',
        authorNickname: 'User 1',
      },
    ];

    const result = selectItemsByColumn(itemsWithoutProblem, ['keep', 'problem', 'try']);

    expect(result.keep).toHaveLength(1);
    expect(result.problem).toEqual([]);
    expect(result.try).toHaveLength(1);
  });

  it('同じカラムに複数のアイテムがある場合、すべて含まれること', () => {
    const multipleKeepItems: KptItem[] = [
      {
        id: '1',
        boardId: 'board-1',
        column: 'keep',
        text: 'Keep 1',
        position: 1000,
        authorId: 'user-1',
        authorNickname: 'User 1',
      },
      {
        id: '2',
        boardId: 'board-1',
        column: 'keep',
        text: 'Keep 2',
        position: 2000,
        authorId: 'user-1',
        authorNickname: 'User 1',
      },
      {
        id: '3',
        boardId: 'board-1',
        column: 'keep',
        text: 'Keep 3',
        position: 3000,
        authorId: 'user-1',
        authorNickname: 'User 1',
      },
    ];

    const result = selectItemsByColumn(multipleKeepItems, ['keep', 'problem', 'try']);

    expect(result.keep).toHaveLength(3);
    expect(result.keep.map((item) => item.id)).toEqual(['1', '2', '3']);
  });
});

describe('selectActiveItem', () => {
  const mockItems: KptItem[] = [
    {
      id: 'item-1',
      boardId: 'board-1',
      column: 'keep',
      text: 'Keep item',
      position: 1000,
      authorId: 'user-1',
      authorNickname: 'User 1',
    },
    {
      id: 'item-2',
      boardId: 'board-1',
      column: 'problem',
      text: 'Problem item',
      position: 1000,
      authorId: 'user-1',
      authorNickname: 'User 1',
    },
    {
      id: 'item-3',
      boardId: 'board-1',
      column: 'try',
      text: 'Try item',
      position: 1000,
      authorId: 'user-2',
      authorNickname: 'User 2',
    },
  ];

  it('activeIdに一致するアイテムを返すこと', () => {
    const result = selectActiveItem(mockItems, 'item-2');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('item-2');
    expect(result?.text).toBe('Problem item');
  });

  it('activeIdがnullの場合、nullを返すこと', () => {
    const result = selectActiveItem(mockItems, null);

    expect(result).toBeNull();
  });

  it('activeIdに一致するアイテムがない場合、nullを返すこと', () => {
    const result = selectActiveItem(mockItems, 'non-existent-id');

    expect(result).toBeNull();
  });

  it('空の配列を渡した場合、nullを返すこと', () => {
    const result = selectActiveItem([], 'item-1');

    expect(result).toBeNull();
  });
});
