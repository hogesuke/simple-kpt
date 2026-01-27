import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/lib/kpt-api';

import { useBoardStore } from './useBoardStore';

import type { KptItem } from '@/types/kpt';

vi.mock('@/lib/kpt-api', () => ({
  fetchBoardMembers: vi.fn(),
  createKptItem: vi.fn(),
  updateKptItem: vi.fn(),
  deleteKptItem: vi.fn(),
  toggleVote: vi.fn(),
  fetchBoard: vi.fn(),
  fetchKptItems: vi.fn(),
  joinBoard: vi.fn(),
}));

vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: 'user-1' },
      profile: { nickname: 'テストユーザー' },
    })),
  },
}));

const createMockItem = (overrides: Partial<KptItem> = {}): KptItem => ({
  id: 'item-1',
  boardId: 'board-1',
  column: 'keep',
  text: 'テストテキスト',
  position: 1000,
  authorId: 'user-1',
  authorNickname: 'テストユーザー',
  createdAt: '2024-01-15T10:30:00.000Z',
  voteCount: 0,
  hasVoted: false,
  voters: [],
  ...overrides,
});

describe('realtimeSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useBoardStore.setState({
      currentBoard: null,
      items: [],
      selectedItem: null,
      isLoading: false,
      isAdding: false,
      loadError: null,
      joinError: null,
      isNotFound: false,
      memberNicknameMap: {},
      filter: { tag: null, memberId: null },
      timerState: null,
      itemEventsChannel: null,
      timerEventsChannel: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleRealtimeInsert', () => {
    it('新しいアイテムを追加すること', async () => {
      const newItem = createMockItem({ id: 'new-item', authorId: 'user-2' });

      await act(async () => {
        await useBoardStore.getState().handleRealtimeInsert(newItem);
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('new-item');
    });

    it('重複するアイテムは追加しないこと', async () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem] });

      await act(async () => {
        await useBoardStore.getState().handleRealtimeInsert(existingItem);
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(1);
    });

    it('一時IDのアイテムと同じtext/columnのアイテムは追加しないこと', async () => {
      const tempItem = createMockItem({ id: 'temp-123', text: 'テスト', column: 'keep' });
      useBoardStore.setState({ items: [tempItem] });

      const newItem = createMockItem({ id: 'real-item', text: 'テスト', column: 'keep' });

      await act(async () => {
        await useBoardStore.getState().handleRealtimeInsert(newItem);
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('temp-123');
    });

    it('キャッシュにニックネームがある場合はそれを使用すること', async () => {
      useBoardStore.setState({ memberNicknameMap: { 'user-2': 'キャッシュユーザー' } });

      const newItem = createMockItem({ id: 'new-item', authorId: 'user-2', authorNickname: null });

      await act(async () => {
        await useBoardStore.getState().handleRealtimeInsert(newItem);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].authorNickname).toBe('キャッシュユーザー');
    });

    it('キャッシュにない場合はAPIからニックネームを取得すること', async () => {
      vi.mocked(api.fetchBoardMembers).mockResolvedValue([
        { userId: 'user-2', nickname: 'APIユーザー', id: 'm1', role: 'member', createdAt: '' },
      ]);

      const newItem = createMockItem({ id: 'new-item', authorId: 'user-2', authorNickname: null, boardId: 'board-1' });

      await act(async () => {
        await useBoardStore.getState().handleRealtimeInsert(newItem);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].authorNickname).toBe('APIユーザー');
      expect(state.memberNicknameMap['user-2']).toBe('APIユーザー');
    });

    it('positionでソートされること', async () => {
      const item1 = createMockItem({ id: 'item-1', position: 2000 });
      const item2 = createMockItem({ id: 'item-2', position: 1000 });
      useBoardStore.setState({ items: [item1] });

      await act(async () => {
        await useBoardStore.getState().handleRealtimeInsert(item2);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].id).toBe('item-2');
      expect(state.items[1].id).toBe('item-1');
    });
  });

  describe('handleRealtimeUpdate', () => {
    it('既存のアイテムを更新すること', () => {
      const existingItem = createMockItem({ id: 'item-1', text: '元のテキスト' });
      useBoardStore.setState({ items: [existingItem] });

      const updatedItem = createMockItem({ id: 'item-1', text: '更新されたテキスト' });

      act(() => {
        useBoardStore.getState().handleRealtimeUpdate(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].text).toBe('更新されたテキスト');
    });

    it('authorNicknameは既存の値を保持すること', () => {
      const existingItem = createMockItem({ id: 'item-1', authorNickname: '元のニックネーム' });
      useBoardStore.setState({ items: [existingItem] });

      const updatedItem = createMockItem({ id: 'item-1', authorNickname: null });

      act(() => {
        useBoardStore.getState().handleRealtimeUpdate(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].authorNickname).toBe('元のニックネーム');
    });

    it('voteCount/hasVotedは既存の値を保持すること', () => {
      const existingItem = createMockItem({ id: 'item-1', voteCount: 5, hasVoted: true });
      useBoardStore.setState({ items: [existingItem] });

      const updatedItem = createMockItem({ id: 'item-1', voteCount: 0, hasVoted: false });

      act(() => {
        useBoardStore.getState().handleRealtimeUpdate(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voteCount).toBe(5);
      expect(state.items[0].hasVoted).toBe(true);
    });

    it('assigneeIdが変更された場合はmemberNicknameMapから取得すること', () => {
      const existingItem = createMockItem({ id: 'item-1', assigneeId: 'user-1', assigneeNickname: 'ユーザー1' });
      useBoardStore.setState({
        items: [existingItem],
        memberNicknameMap: { 'user-2': 'ユーザー2' },
      });

      const updatedItem = createMockItem({ id: 'item-1', assigneeId: 'user-2', assigneeNickname: null });

      act(() => {
        useBoardStore.getState().handleRealtimeUpdate(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].assigneeNickname).toBe('ユーザー2');
    });

    it('selectedItemも同時に更新すること', () => {
      const existingItem = createMockItem({ id: 'item-1', text: '元のテキスト' });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem });

      const updatedItem = createMockItem({ id: 'item-1', text: '更新されたテキスト' });

      act(() => {
        useBoardStore.getState().handleRealtimeUpdate(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.selectedItem?.text).toBe('更新されたテキスト');
    });

    it('存在しないアイテムの場合は何もしないこと', () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem] });

      const updatedItem = createMockItem({ id: 'non-existent' });

      act(() => {
        useBoardStore.getState().handleRealtimeUpdate(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('item-1');
    });

    it('positionでソートされること', () => {
      const item1 = createMockItem({ id: 'item-1', position: 1000 });
      const item2 = createMockItem({ id: 'item-2', position: 2000 });
      useBoardStore.setState({ items: [item1, item2] });

      const updatedItem1 = createMockItem({ id: 'item-1', position: 3000 });

      act(() => {
        useBoardStore.getState().handleRealtimeUpdate(updatedItem1);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].id).toBe('item-2');
      expect(state.items[1].id).toBe('item-1');
    });
  });

  describe('handleRealtimeDelete', () => {
    it('アイテムを削除すること', () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeDelete('item-1');
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('削除されたアイテムがselectedItemの場合はクリアすること', () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem });

      act(() => {
        useBoardStore.getState().handleRealtimeDelete('item-1');
      });

      const state = useBoardStore.getState();
      expect(state.selectedItem).toBeNull();
    });

    it('selectedItemが別のアイテムの場合はクリアしないこと', () => {
      const item1 = createMockItem({ id: 'item-1' });
      const item2 = createMockItem({ id: 'item-2' });
      useBoardStore.setState({ items: [item1, item2], selectedItem: item2 });

      act(() => {
        useBoardStore.getState().handleRealtimeDelete('item-1');
      });

      const state = useBoardStore.getState();
      expect(state.selectedItem?.id).toBe('item-2');
    });

    it('存在しないアイテムの場合は何もしないこと', () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeDelete('non-existent');
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(1);
    });
  });

  describe('handleRealtimeVoteChanged', () => {
    it('投票数を更新すること', () => {
      const existingItem = createMockItem({ id: 'item-1', voteCount: 0 });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeVoteChanged('item-1', 5);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voteCount).toBe(5);
    });

    it('投票追加時にvotersを更新すること', () => {
      const existingItem = createMockItem({ id: 'item-1', voteCount: 0, voters: [] });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeVoteChanged('item-1', 1, {
          id: 'user-2',
          nickname: 'ユーザー2',
          hasVoted: true,
        });
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voters).toContainEqual({ id: 'user-2', nickname: 'ユーザー2' });
    });

    it('投票取り消し時にvotersから削除すること', () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 1,
        voters: [{ id: 'user-2', nickname: 'ユーザー2' }],
      });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeVoteChanged('item-1', 0, {
          id: 'user-2',
          nickname: 'ユーザー2',
          hasVoted: false,
        });
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voters).not.toContainEqual({ id: 'user-2', nickname: 'ユーザー2' });
    });

    it('既にvotersにいるユーザーは追加しないこと', () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 1,
        voters: [{ id: 'user-2', nickname: 'ユーザー2' }],
      });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeVoteChanged('item-1', 1, {
          id: 'user-2',
          nickname: 'ユーザー2',
          hasVoted: true,
        });
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voters).toHaveLength(1);
    });

    it('selectedItemも同時に更新すること', () => {
      const existingItem = createMockItem({ id: 'item-1', voteCount: 0 });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem });

      act(() => {
        useBoardStore.getState().handleRealtimeVoteChanged('item-1', 5);
      });

      const state = useBoardStore.getState();
      expect(state.selectedItem?.voteCount).toBe(5);
    });

    it('存在しないアイテムの場合は何もしないこと', () => {
      const existingItem = createMockItem({ id: 'item-1', voteCount: 0 });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeVoteChanged('non-existent', 5);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voteCount).toBe(0);
    });

    it('voterがundefinedの場合はvotersを更新しないこと', () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 0,
        voters: [{ id: 'user-1', nickname: 'ユーザー1' }],
      });
      useBoardStore.setState({ items: [existingItem] });

      act(() => {
        useBoardStore.getState().handleRealtimeVoteChanged('item-1', 5);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voters).toHaveLength(1);
    });
  });

  describe('fetchAndCacheNickname', () => {
    it('APIからニックネームを取得してキャッシュすること', async () => {
      vi.mocked(api.fetchBoardMembers).mockResolvedValue([
        { userId: 'user-2', nickname: 'ユーザー2', id: 'm1', role: 'member', createdAt: '' },
      ]);

      let result: string | null = null;
      await act(async () => {
        result = await useBoardStore.getState().fetchAndCacheNickname('board-1', 'user-2');
      });

      expect(result).toBe('ユーザー2');
      expect(useBoardStore.getState().memberNicknameMap['user-2']).toBe('ユーザー2');
    });

    it('membersとmemberNicknameMapが更新されること', async () => {
      const mockMembers = [
        { userId: 'user-1', nickname: 'ユーザー1', id: 'm1', role: 'owner', createdAt: '' },
        { userId: 'user-2', nickname: 'ユーザー2', id: 'm2', role: 'member', createdAt: '' },
      ];
      vi.mocked(api.fetchBoardMembers).mockResolvedValue(mockMembers);

      await act(async () => {
        await useBoardStore.getState().fetchAndCacheNickname('board-1', 'user-2');
      });

      const state = useBoardStore.getState();
      expect(state.members).toEqual(mockMembers);
      expect(state.memberNicknameMap).toEqual({
        'user-1': 'ユーザー1',
        'user-2': 'ユーザー2',
      });
    });

    it('メンバーが見つからない場合はnullを返すこと', async () => {
      vi.mocked(api.fetchBoardMembers).mockResolvedValue([]);

      let result: string | null = null;
      await act(async () => {
        result = await useBoardStore.getState().fetchAndCacheNickname('board-1', 'user-2');
      });

      expect(result).toBeNull();
    });

    it('APIエラー時はnullを返すこと', async () => {
      vi.mocked(api.fetchBoardMembers).mockRejectedValue(new Error('API Error'));

      let result: string | null = null;
      await act(async () => {
        result = await useBoardStore.getState().fetchAndCacheNickname('board-1', 'user-2');
      });

      expect(result).toBeNull();
    });

    it('ニックネームがnullの場合は空文字をキャッシュすること', async () => {
      vi.mocked(api.fetchBoardMembers).mockResolvedValue([{ userId: 'user-2', nickname: null, id: 'm1', role: 'member', createdAt: '' }]);

      await act(async () => {
        await useBoardStore.getState().fetchAndCacheNickname('board-1', 'user-2');
      });

      expect(useBoardStore.getState().memberNicknameMap['user-2']).toBe('');
    });
  });
});
