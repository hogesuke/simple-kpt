import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

import { useBoardStore } from './useBoardStore';

import type { KptItem } from '@/types/kpt';

vi.mock('@/lib/kpt-api', () => ({
  createKptItem: vi.fn(),
  updateKptItem: vi.fn(),
  deleteKptItem: vi.fn(),
  toggleVote: vi.fn(),
  fetchBoard: vi.fn(),
  fetchKptItems: vi.fn(),
  fetchBoardMembers: vi.fn(),
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

describe('useBoardStore', () => {
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
      members: [],
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

  describe('addItem', () => {
    it('アイテムが楽観的追加され、APIレスポンスで置換すること', async () => {
      const newItem = createMockItem({ id: 'new-item-1', text: '新しいアイテム' });
      vi.mocked(api.createKptItem).mockResolvedValue(newItem);

      await act(async () => {
        await useBoardStore.getState().addItem('board-1', 'keep', '新しいアイテム');
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('new-item-1');
      expect(state.items[0].text).toBe('新しいアイテム');
      expect(state.isAdding).toBe(false);
    });

    it('APIエラー時にロールバックすること', async () => {
      vi.mocked(api.createKptItem).mockRejectedValue(new Error('API Error'));

      await expect(
        act(async () => {
          await useBoardStore.getState().addItem('board-1', 'keep', '新しいアイテム');
        })
      ).rejects.toThrow('API Error');

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.isAdding).toBe(false);
    });

    it('同じカラム内の最大positionの後に配置すること', async () => {
      const existingItem = createMockItem({ id: 'existing-1', position: 2000 });
      useBoardStore.setState({ items: [existingItem] });

      const newItem = createMockItem({ id: 'new-item-1', position: 3000 });
      vi.mocked(api.createKptItem).mockResolvedValue(newItem);

      await act(async () => {
        await useBoardStore.getState().addItem('board-1', 'keep', '新しいアイテム');
      });

      // 楽観的更新時のpositionは maxPosition + 1000 = 3000
      expect(api.createKptItem).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('アイテムが楽観的更新されること', async () => {
      const existingItem = createMockItem({ id: 'item-1', text: '元のテキスト' });
      useBoardStore.setState({ items: [existingItem] });

      const updatedItem = { ...existingItem, text: '更新されたテキスト' };
      vi.mocked(api.updateKptItem).mockResolvedValue(updatedItem);

      await act(async () => {
        await useBoardStore.getState().updateItem(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.items[0].text).toBe('更新されたテキスト');
    });

    it('selectedItemも同時に更新すること', async () => {
      const existingItem = createMockItem({ id: 'item-1', text: '元のテキスト' });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem });

      const updatedItem = { ...existingItem, text: '更新されたテキスト' };
      vi.mocked(api.updateKptItem).mockResolvedValue(updatedItem);

      await act(async () => {
        await useBoardStore.getState().updateItem(updatedItem);
      });

      const state = useBoardStore.getState();
      expect(state.selectedItem?.text).toBe('更新されたテキスト');
    });

    it('APIエラー時にロールバックすること', async () => {
      const existingItem = createMockItem({ id: 'item-1', text: '元のテキスト' });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem });

      vi.mocked(api.updateKptItem).mockRejectedValue(new Error('API Error'));

      const updatedItem = { ...existingItem, text: '更新されたテキスト' };

      await expect(
        act(async () => {
          await useBoardStore.getState().updateItem(updatedItem);
        })
      ).rejects.toThrow('API Error');

      const state = useBoardStore.getState();
      expect(state.items[0].text).toBe('元のテキスト');
      expect(state.selectedItem?.text).toBe('元のテキスト');
    });
  });

  describe('deleteItem', () => {
    it('アイテムが楽観的削除されること', async () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem] });

      vi.mocked(api.deleteKptItem).mockResolvedValue(undefined);

      await act(async () => {
        await useBoardStore.getState().deleteItem('item-1', 'board-1');
      });

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('削除されたアイテムがselectedItemの場合はクリアすること', async () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem });

      vi.mocked(api.deleteKptItem).mockResolvedValue(undefined);

      await act(async () => {
        await useBoardStore.getState().deleteItem('item-1', 'board-1');
      });

      const state = useBoardStore.getState();
      expect(state.selectedItem).toBeNull();
    });

    it('APIエラー時にロールバックすること', async () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem });

      vi.mocked(api.deleteKptItem).mockRejectedValue(new Error('API Error'));

      await expect(
        act(async () => {
          await useBoardStore.getState().deleteItem('item-1', 'board-1');
        })
      ).rejects.toThrow('API Error');

      const state = useBoardStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('item-1');
      expect(state.selectedItem?.id).toBe('item-1');
    });

    it('削除成功時にBroadcastが送信されること', async () => {
      const existingItem = createMockItem({ id: 'item-1' });
      const mockSend = vi.fn().mockResolvedValue(undefined);
      const mockChannel = { send: mockSend };

      useBoardStore.setState({
        items: [existingItem],
        itemEventsChannel: mockChannel as unknown as ReturnType<typeof useBoardStore.getState>['itemEventsChannel'],
      });

      vi.mocked(api.deleteKptItem).mockResolvedValue(undefined);

      await act(async () => {
        await useBoardStore.getState().deleteItem('item-1', 'board-1');
      });

      expect(mockSend).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'item-deleted',
        payload: { itemId: 'item-1' },
      });
    });

    it('itemEventsChannelがnullの場合はBroadcast送信をスキップすること', async () => {
      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem], itemEventsChannel: null });

      vi.mocked(api.deleteKptItem).mockResolvedValue(undefined);

      await act(async () => {
        await useBoardStore.getState().deleteItem('item-1', 'board-1');
      });

      // エラーなく完了すること（Broadcastは送信されない）
      expect(useBoardStore.getState().items).toHaveLength(0);
    });
  });

  describe('toggleVote', () => {
    it('投票が楽観的追加すること', async () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 0,
        hasVoted: false,
        voters: [],
      });
      useBoardStore.setState({ items: [existingItem], itemEventsChannel: null });

      vi.mocked(api.toggleVote).mockResolvedValue({
        itemId: 'item-1',
        voteCount: 1,
        hasVoted: true,
      });

      await act(async () => {
        await useBoardStore.getState().toggleVote('item-1');
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voteCount).toBe(1);
      expect(state.items[0].hasVoted).toBe(true);
    });

    it('投票が楽観的取り消しされること', async () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 1,
        hasVoted: true,
        voters: [{ id: 'user-1', nickname: 'テストユーザー' }],
      });
      useBoardStore.setState({ items: [existingItem], itemEventsChannel: null });

      vi.mocked(api.toggleVote).mockResolvedValue({
        itemId: 'item-1',
        voteCount: 0,
        hasVoted: false,
      });

      await act(async () => {
        await useBoardStore.getState().toggleVote('item-1');
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voteCount).toBe(0);
      expect(state.items[0].hasVoted).toBe(false);
    });

    it('selectedItemも同時に更新すること', async () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 0,
        hasVoted: false,
        voters: [],
      });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem, itemEventsChannel: null });

      vi.mocked(api.toggleVote).mockResolvedValue({
        itemId: 'item-1',
        voteCount: 1,
        hasVoted: true,
      });

      await act(async () => {
        await useBoardStore.getState().toggleVote('item-1');
      });

      const state = useBoardStore.getState();
      expect(state.selectedItem?.voteCount).toBe(1);
      expect(state.selectedItem?.hasVoted).toBe(true);
    });

    it('APIエラー時にロールバックすること', async () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 0,
        hasVoted: false,
        voters: [],
      });
      useBoardStore.setState({ items: [existingItem], selectedItem: existingItem, itemEventsChannel: null });

      vi.mocked(api.toggleVote).mockRejectedValue(new Error('API Error'));

      await expect(
        act(async () => {
          await useBoardStore.getState().toggleVote('item-1');
        })
      ).rejects.toThrow('API Error');

      const state = useBoardStore.getState();
      expect(state.items[0].voteCount).toBe(0);
      expect(state.items[0].hasVoted).toBe(false);
      expect(state.selectedItem?.voteCount).toBe(0);
      expect(state.selectedItem?.hasVoted).toBe(false);
    });

    it('votersが楽観的更新されること', async () => {
      const existingItem = createMockItem({
        id: 'item-1',
        voteCount: 0,
        hasVoted: false,
        voters: [],
      });
      useBoardStore.setState({ items: [existingItem], itemEventsChannel: null });

      vi.mocked(api.toggleVote).mockResolvedValue({
        itemId: 'item-1',
        voteCount: 1,
        hasVoted: true,
      });

      await act(async () => {
        await useBoardStore.getState().toggleVote('item-1');
      });

      const state = useBoardStore.getState();
      expect(state.items[0].voters).toContainEqual({
        id: 'user-1',
        nickname: 'テストユーザー',
      });
    });

    it('存在しないアイテムの場合は何もしないこと', async () => {
      useBoardStore.setState({ items: [], itemEventsChannel: null });

      await act(async () => {
        await useBoardStore.getState().toggleVote('non-existent');
      });

      expect(api.toggleVote).not.toHaveBeenCalled();
    });

    it('ユーザーがログインしていない場合は何もしないこと', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        profile: null,
      } as ReturnType<typeof useAuthStore.getState>);

      const existingItem = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ items: [existingItem], itemEventsChannel: null });

      await act(async () => {
        await useBoardStore.getState().toggleVote('item-1');
      });

      expect(api.toggleVote).not.toHaveBeenCalled();
    });
  });

  describe('setSelectedItem', () => {
    it('selectedItemを設定できること', () => {
      const item = createMockItem({ id: 'item-1' });

      act(() => {
        useBoardStore.getState().setSelectedItem(item);
      });

      expect(useBoardStore.getState().selectedItem).toEqual(item);
    });

    it('selectedItemをnullに設定できること', () => {
      const item = createMockItem({ id: 'item-1' });
      useBoardStore.setState({ selectedItem: item });

      act(() => {
        useBoardStore.getState().setSelectedItem(null);
      });

      expect(useBoardStore.getState().selectedItem).toBeNull();
    });
  });

  describe('setFilterTag', () => {
    it('filterTagを設定できること', () => {
      act(() => {
        useBoardStore.getState().setFilterTag('#テスト');
      });

      expect(useBoardStore.getState().filter.tag).toBe('#テスト');
    });

    it('filterTagをnullに設定できること', () => {
      useBoardStore.setState({ filter: { tag: '#テスト', memberId: null } });

      act(() => {
        useBoardStore.getState().setFilterTag(null);
      });

      expect(useBoardStore.getState().filter.tag).toBeNull();
    });
  });

  describe('setFilterMemberId', () => {
    it('filterMemberIdを設定できること', () => {
      act(() => {
        useBoardStore.getState().setFilterMemberId('user-1');
      });

      expect(useBoardStore.getState().filter.memberId).toBe('user-1');
    });

    it('filterMemberIdをnullに設定できること', () => {
      useBoardStore.setState({ filter: { tag: null, memberId: 'user-1' } });

      act(() => {
        useBoardStore.getState().setFilterMemberId(null);
      });

      expect(useBoardStore.getState().filter.memberId).toBeNull();
    });
  });

  describe('loadBoard', () => {
    const mockBoard = {
      id: 'board-1',
      name: 'テストボード',
      isMember: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const mockMembers = [
      { id: 'member-1', userId: 'user-1', role: 'owner', createdAt: '2024-01-01', nickname: 'ユーザー1' },
      { id: 'member-2', userId: 'user-2', role: 'member', createdAt: '2024-01-02', nickname: 'ユーザー2' },
    ];

    const mockItems = [createMockItem({ id: 'item-1' })];

    it('ボード読み込み時にmembersとmemberNicknameMapが設定されること', async () => {
      vi.mocked(api.fetchBoard).mockResolvedValue(mockBoard);
      vi.mocked(api.fetchKptItems).mockResolvedValue(mockItems);
      vi.mocked(api.fetchBoardMembers).mockResolvedValue(mockMembers);

      await act(async () => {
        await useBoardStore.getState().loadBoard('board-1');
      });

      const state = useBoardStore.getState();
      expect(state.members).toEqual(mockMembers);
      expect(state.memberNicknameMap).toEqual({
        'user-1': 'ユーザー1',
        'user-2': 'ユーザー2',
      });
      expect(state.isLoading).toBe(false);
    });

    it('fetchBoardMembersがエラーでもボード読み込みは成功すること', async () => {
      vi.mocked(api.fetchBoard).mockResolvedValue(mockBoard);
      vi.mocked(api.fetchKptItems).mockResolvedValue(mockItems);
      vi.mocked(api.fetchBoardMembers).mockRejectedValue(new Error('Members fetch failed'));

      await act(async () => {
        await useBoardStore.getState().loadBoard('board-1');
      });

      const state = useBoardStore.getState();
      expect(state.members).toEqual([]);
      expect(state.memberNicknameMap).toEqual({});
      expect(state.currentBoard).toEqual(mockBoard);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('membersがクリアされること', () => {
      const mockMembers = [{ id: 'member-1', userId: 'user-1', role: 'owner', createdAt: '2024-01-01', nickname: 'ユーザー1' }];
      useBoardStore.setState({
        members: mockMembers,
        memberNicknameMap: { 'user-1': 'ユーザー1' },
        items: [createMockItem()],
      });

      act(() => {
        useBoardStore.getState().reset();
      });

      const state = useBoardStore.getState();
      expect(state.members).toEqual([]);
      expect(state.memberNicknameMap).toEqual({});
      expect(state.items).toEqual([]);
    });
  });
});
