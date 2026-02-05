import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as kptApi from '@/lib/kpt-api';

import { useHomeStore } from './useHomeStore';

import type { KptBoard, TryItemWithBoard } from '@/types/kpt';

vi.mock('@/i18n', () => ({
  default: {
    t: (key: string) => key.replace('error:', ''),
  },
}));

vi.mock('@/lib/kpt-api', () => ({
  fetchBoards: vi.fn(),
  fetchTryItems: vi.fn(),
}));

const mockFetchBoards = vi.mocked(kptApi.fetchBoards);
const mockFetchTryItems = vi.mocked(kptApi.fetchTryItems);

const createMockBoard = (id: string, name: string): KptBoard => ({
  id,
  name,
  ownerId: 'owner-1',
  createdAt: '2024-01-01T00:00:00Z',
});

const createMockTryItem = (id: string): TryItemWithBoard => ({
  id,
  text: `Try item ${id}`,
  column: 'try',
  boardId: 'board-1',
  boardName: 'Test Board',
  authorId: 'author-1',
  authorNickname: 'Author',
  position: 0,
  status: 'pending',
  assigneeId: null,
  assigneeNickname: null,
  dueDate: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('useHomeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useHomeStore.setState({
      activeTab: 'boards',
      boards: [],
      isBoardsLoading: true,
      isBoardsLoadingMore: false,
      boardsError: null,
      boardsCursor: null,
      boardsHasMore: false,
      tryItems: [],
      isTryLoading: false,
      isTryLoadingMore: false,
      tryError: null,
      tryOffset: 0,
      tryHasMore: false,
      hasTryLoaded: false,
      filterStatuses: ['pending', 'in_progress'],
      filterAssignee: null,
    });
  });

  describe('初期状態', () => {
    it('activeTabが"boards"であること', () => {
      const state = useHomeStore.getState();
      expect(state.activeTab).toBe('boards');
    });

    it('filterStatusesがデフォルト値であること', () => {
      const state = useHomeStore.getState();
      expect(state.filterStatuses).toEqual(['pending', 'in_progress']);
    });

    it('filterAssigneeがnullであること', () => {
      const state = useHomeStore.getState();
      expect(state.filterAssignee).toBeNull();
    });

    it('boardsが空配列であること', () => {
      const state = useHomeStore.getState();
      expect(state.boards).toEqual([]);
    });

    it('tryItemsが空配列であること', () => {
      const state = useHomeStore.getState();
      expect(state.tryItems).toEqual([]);
    });

    it('hasTryLoadedがfalseであること', () => {
      const state = useHomeStore.getState();
      expect(state.hasTryLoaded).toBe(false);
    });
  });

  describe('setActiveTab', () => {
    it('タブを"try"に変更できること', () => {
      useHomeStore.getState().setActiveTab('try');
      expect(useHomeStore.getState().activeTab).toBe('try');
    });

    it('タブを"boards"に変更できること', () => {
      useHomeStore.getState().setActiveTab('try');
      useHomeStore.getState().setActiveTab('boards');
      expect(useHomeStore.getState().activeTab).toBe('boards');
    });
  });

  describe('setFilterStatuses', () => {
    it('フィルターステータスを設定できること', () => {
      useHomeStore.getState().setFilterStatuses(['done']);
      expect(useHomeStore.getState().filterStatuses).toEqual(['done']);
    });

    it('複数のステータスを設定できること', () => {
      useHomeStore.getState().setFilterStatuses(['pending', 'in_progress', 'done']);
      expect(useHomeStore.getState().filterStatuses).toEqual(['pending', 'in_progress', 'done']);
    });

    it('空の配列を設定できること', () => {
      useHomeStore.getState().setFilterStatuses([]);
      expect(useHomeStore.getState().filterStatuses).toEqual([]);
    });

    it('wont_fixステータスを含めて設定できること', () => {
      useHomeStore.getState().setFilterStatuses(['wont_fix']);
      expect(useHomeStore.getState().filterStatuses).toEqual(['wont_fix']);
    });

    it('全てのステータスを設定できること', () => {
      const allStatuses = ['pending', 'in_progress', 'done', 'wont_fix'] as const;
      useHomeStore.getState().setFilterStatuses([...allStatuses]);
      expect(useHomeStore.getState().filterStatuses).toEqual([...allStatuses]);
    });
  });

  describe('setFilterAssignee', () => {
    it('担当者フィルターを設定できること', () => {
      const assignee = { id: 'user-1', nickname: 'テストユーザー' };
      useHomeStore.getState().setFilterAssignee(assignee);
      expect(useHomeStore.getState().filterAssignee).toEqual(assignee);
    });

    it('担当者フィルターをnullにできること', () => {
      const assignee = { id: 'user-1', nickname: 'テストユーザー' };
      useHomeStore.getState().setFilterAssignee(assignee);
      useHomeStore.getState().setFilterAssignee(null);
      expect(useHomeStore.getState().filterAssignee).toBeNull();
    });

    it('異なる担当者に変更できること', () => {
      const assignee1 = { id: 'user-1', nickname: 'ユーザー1' };
      const assignee2 = { id: 'user-2', nickname: 'ユーザー2' };

      useHomeStore.getState().setFilterAssignee(assignee1);
      expect(useHomeStore.getState().filterAssignee).toEqual(assignee1);

      useHomeStore.getState().setFilterAssignee(assignee2);
      expect(useHomeStore.getState().filterAssignee).toEqual(assignee2);
    });
  });

  describe('loadBoards', () => {
    it('ボードを読み込めること', async () => {
      const mockBoards = [createMockBoard('1', 'Board 1'), createMockBoard('2', 'Board 2')];
      mockFetchBoards.mockResolvedValueOnce({
        items: mockBoards,
        hasMore: false,
        nextCursor: null,
      });

      await useHomeStore.getState().loadBoards();

      const state = useHomeStore.getState();
      expect(state.boards).toEqual(mockBoards);
      expect(state.isBoardsLoading).toBe(false);
      expect(state.boardsHasMore).toBe(false);
    });

    it('読み込み中はisBoardsLoadingがtrueになること', async () => {
      mockFetchBoards.mockImplementation(() => new Promise(() => {})); // 永続的にpending

      void useHomeStore.getState().loadBoards();

      expect(useHomeStore.getState().isBoardsLoading).toBe(true);
    });

    it('ページネーション情報が正しく設定されること', async () => {
      mockFetchBoards.mockResolvedValueOnce({
        items: [createMockBoard('1', 'Board 1')],
        hasMore: true,
        nextCursor: 'cursor-1',
      });

      await useHomeStore.getState().loadBoards();

      const state = useHomeStore.getState();
      expect(state.boardsHasMore).toBe(true);
      expect(state.boardsCursor).toBe('cursor-1');
    });

    it('追加読み込みでボードが追加されること', async () => {
      // 初回読み込み
      mockFetchBoards.mockResolvedValueOnce({
        items: [createMockBoard('1', 'Board 1')],
        hasMore: true,
        nextCursor: 'cursor-1',
      });
      await useHomeStore.getState().loadBoards();

      // 追加読み込み
      mockFetchBoards.mockResolvedValueOnce({
        items: [createMockBoard('2', 'Board 2')],
        hasMore: false,
        nextCursor: null,
      });
      await useHomeStore.getState().loadBoards(false);

      const state = useHomeStore.getState();
      expect(state.boards).toHaveLength(2);
      expect(state.boards[0].id).toBe('1');
      expect(state.boards[1].id).toBe('2');
    });

    it('エラー時にboardsErrorが設定されること', async () => {
      mockFetchBoards.mockRejectedValueOnce(new Error('Network error'));

      await useHomeStore.getState().loadBoards();

      const state = useHomeStore.getState();
      expect(state.boardsError).toBe('ボードリストの読み込みに失敗しました');
      expect(state.isBoardsLoading).toBe(false);
    });

    it('reset=trueで既存のボードが置き換わること', async () => {
      // 既存データを設定
      useHomeStore.setState({ boards: [createMockBoard('old', 'Old Board')] });

      mockFetchBoards.mockResolvedValueOnce({
        items: [createMockBoard('new', 'New Board')],
        hasMore: false,
        nextCursor: null,
      });

      await useHomeStore.getState().loadBoards(true);

      const state = useHomeStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards[0].id).toBe('new');
    });
  });

  describe('addBoard', () => {
    it('ボードを先頭に追加できること', () => {
      useHomeStore.setState({ boards: [createMockBoard('1', 'Board 1')] });

      const newBoard = createMockBoard('2', 'Board 2');
      useHomeStore.getState().addBoard(newBoard);

      const state = useHomeStore.getState();
      expect(state.boards).toHaveLength(2);
      expect(state.boards[0].id).toBe('2');
      expect(state.boards[1].id).toBe('1');
    });
  });

  describe('updateBoard', () => {
    it('ボードを更新できること', () => {
      const board = createMockBoard('1', 'Original Name');
      useHomeStore.setState({ boards: [board] });

      const updatedBoard = { ...board, name: 'Updated Name' };
      useHomeStore.getState().updateBoard('1', updatedBoard);

      const state = useHomeStore.getState();
      expect(state.boards[0].name).toBe('Updated Name');
    });

    it('存在しないボードIDでは何も変更されないこと', () => {
      const board = createMockBoard('1', 'Board 1');
      useHomeStore.setState({ boards: [board] });

      const updatedBoard = createMockBoard('2', 'Board 2');
      useHomeStore.getState().updateBoard('non-existent', updatedBoard);

      const state = useHomeStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards[0].id).toBe('1');
    });
  });

  describe('removeBoard', () => {
    it('ボードを削除できること', () => {
      useHomeStore.setState({
        boards: [createMockBoard('1', 'Board 1'), createMockBoard('2', 'Board 2')],
      });

      useHomeStore.getState().removeBoard('1');

      const state = useHomeStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards[0].id).toBe('2');
    });

    it('存在しないボードIDでは何も削除されないこと', () => {
      useHomeStore.setState({ boards: [createMockBoard('1', 'Board 1')] });

      useHomeStore.getState().removeBoard('non-existent');

      expect(useHomeStore.getState().boards).toHaveLength(1);
    });
  });

  describe('loadTryItems', () => {
    it('Tryアイテムを読み込めること', async () => {
      const mockItems = [createMockTryItem('1'), createMockTryItem('2')];
      mockFetchTryItems.mockResolvedValueOnce({
        items: mockItems,
        hasMore: false,
      });

      await useHomeStore.getState().loadTryItems();

      const state = useHomeStore.getState();
      expect(state.tryItems).toEqual(mockItems);
      expect(state.isTryLoading).toBe(false);
      expect(state.tryHasMore).toBe(false);
    });

    it('読み込み中はisTryLoadingがtrueになること', async () => {
      mockFetchTryItems.mockImplementation(() => new Promise(() => {}));

      void useHomeStore.getState().loadTryItems();

      expect(useHomeStore.getState().isTryLoading).toBe(true);
    });

    it('フィルター条件がAPIに渡されること', async () => {
      useHomeStore.setState({
        filterStatuses: ['done'],
        filterAssignee: { id: 'user-1', nickname: 'User 1' },
      });

      mockFetchTryItems.mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      await useHomeStore.getState().loadTryItems();

      expect(mockFetchTryItems).toHaveBeenCalledWith({
        status: ['done'],
        assigneeId: 'user-1',
        limit: 20,
        offset: 0,
      });
    });

    it('追加読み込みでアイテムが追加されること', async () => {
      // 初回読み込み
      mockFetchTryItems.mockResolvedValueOnce({
        items: [createMockTryItem('1')],
        hasMore: true,
      });
      await useHomeStore.getState().loadTryItems();

      // 追加読み込み
      mockFetchTryItems.mockResolvedValueOnce({
        items: [createMockTryItem('2')],
        hasMore: false,
      });
      await useHomeStore.getState().loadTryItems(false);

      const state = useHomeStore.getState();
      expect(state.tryItems).toHaveLength(2);
    });

    it('エラー時にtryErrorが設定されること', async () => {
      mockFetchTryItems.mockRejectedValueOnce(new Error('Network error'));

      await useHomeStore.getState().loadTryItems();

      const state = useHomeStore.getState();
      expect(state.tryError).toBe('Tryアイテムの読み込みに失敗しました');
      expect(state.isTryLoading).toBe(false);
    });

    it('reset=trueで既存のアイテムが置き換わること', async () => {
      useHomeStore.setState({ tryItems: [createMockTryItem('old')] });

      mockFetchTryItems.mockResolvedValueOnce({
        items: [createMockTryItem('new')],
        hasMore: false,
      });

      await useHomeStore.getState().loadTryItems(true);

      const state = useHomeStore.getState();
      expect(state.tryItems).toHaveLength(1);
      expect(state.tryItems[0].id).toBe('new');
    });

    it('filterStatusesが空の場合はstatusパラメータがundefinedになること', async () => {
      useHomeStore.setState({ filterStatuses: [] });

      mockFetchTryItems.mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      await useHomeStore.getState().loadTryItems();

      expect(mockFetchTryItems).toHaveBeenCalledWith({
        status: undefined,
        assigneeId: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('読み込み完了後にhasTryLoadedがtrueになること', async () => {
      mockFetchTryItems.mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      expect(useHomeStore.getState().hasTryLoaded).toBe(false);

      await useHomeStore.getState().loadTryItems();

      expect(useHomeStore.getState().hasTryLoaded).toBe(true);
    });

    it('エラー時もhasTryLoadedがtrueになること', async () => {
      mockFetchTryItems.mockRejectedValueOnce(new Error('Network error'));

      await useHomeStore.getState().loadTryItems();

      expect(useHomeStore.getState().hasTryLoaded).toBe(true);
    });
  });

  describe('複合操作', () => {
    it('タブ変更とフィルター変更が独立して動作すること', () => {
      useHomeStore.getState().setActiveTab('try');
      useHomeStore.getState().setFilterStatuses(['done']);
      useHomeStore.getState().setFilterAssignee({ id: 'user-1', nickname: 'テスト' });

      const state = useHomeStore.getState();
      expect(state.activeTab).toBe('try');
      expect(state.filterStatuses).toEqual(['done']);
      expect(state.filterAssignee).toEqual({ id: 'user-1', nickname: 'テスト' });
    });

    it('フィルター変更がタブに影響しないこと', () => {
      useHomeStore.getState().setFilterStatuses(['done', 'wont_fix']);

      expect(useHomeStore.getState().activeTab).toBe('boards');
    });

    it('タブ変更がフィルターに影響しないこと', () => {
      useHomeStore.getState().setFilterStatuses(['done']);
      useHomeStore.getState().setFilterAssignee({ id: 'user-1', nickname: 'テスト' });
      useHomeStore.getState().setActiveTab('try');

      const state = useHomeStore.getState();
      expect(state.filterStatuses).toEqual(['done']);
      expect(state.filterAssignee).toEqual({ id: 'user-1', nickname: 'テスト' });
    });

    it('ボード操作がTryアイテムに影響しないこと', async () => {
      useHomeStore.setState({ tryItems: [createMockTryItem('1')] });

      mockFetchBoards.mockResolvedValueOnce({
        items: [createMockBoard('1', 'Board 1')],
        hasMore: false,
        nextCursor: null,
      });

      await useHomeStore.getState().loadBoards();

      expect(useHomeStore.getState().tryItems).toHaveLength(1);
    });
  });
});
