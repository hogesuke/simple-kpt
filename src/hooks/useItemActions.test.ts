import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError } from '@/lib/api-error';

import { useItemActions } from './useItemActions';

import type { KptItem } from '@/types/kpt';

vi.mock('@/i18n', () => ({
  default: {
    t: (key: string) => key.replace('error:', ''),
  },
}));

const mockHandleError = vi.fn();
vi.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: mockHandleError,
  }),
}));

const mockDeleteItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockSetFilterTag = vi.fn();
const mockSetFilterMemberId = vi.fn();
const mockToggleVote = vi.fn();

vi.mock('@/stores/useBoardStore', () => ({
  useBoardStore: vi.fn((selector) => {
    const state = {
      deleteItem: mockDeleteItem,
      updateItem: mockUpdateItem,
      setFilterTag: mockSetFilterTag,
      setFilterMemberId: mockSetFilterMemberId,
      toggleVote: mockToggleVote,
    };
    return selector(state);
  }),
}));

describe('useItemActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleDeleteItem', () => {
    it('アイテムを正常に削除できること', async () => {
      mockDeleteItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useItemActions('board-1'));

      await act(async () => {
        await result.current.handleDeleteItem('item-1');
      });

      expect(mockDeleteItem).toHaveBeenCalledWith('item-1', 'board-1');
    });

    it('boardIdがundefinedの場合、何もしないこと', async () => {
      const { result } = renderHook(() => useItemActions(undefined));

      await act(async () => {
        await result.current.handleDeleteItem('item-1');
      });

      expect(mockDeleteItem).not.toHaveBeenCalled();
    });

    it('削除に失敗した場合、handleErrorが呼び出されること', async () => {
      const mockError = new APIError('削除に失敗しました', 500);
      mockDeleteItem.mockRejectedValue(mockError);

      const { result } = renderHook(() => useItemActions('board-1'));

      await act(async () => {
        await result.current.handleDeleteItem('item-1');
      });

      expect(mockHandleError).toHaveBeenCalledWith(mockError, 'カードの削除に失敗しました');
    });
  });

  describe('handleItemDrop', () => {
    const mockItem: KptItem = {
      id: 'item-1',
      boardId: 'board-1',
      column: 'keep',
      text: 'テストアイテム',
      position: 1000,
      authorId: 'user-1',
      authorNickname: 'テストユーザー',
      createdAt: '2026-01-01T00:00:00Z',
    };

    it('アイテムを正常に更新できること', async () => {
      mockUpdateItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useItemActions('board-1'));

      await act(async () => {
        await result.current.handleItemDrop(mockItem);
      });

      expect(mockUpdateItem).toHaveBeenCalledWith(mockItem);
    });

    it('更新に失敗した場合、handleErrorが呼び出されること', async () => {
      const mockError = new APIError('更新に失敗しました', 500);
      mockUpdateItem.mockRejectedValue(mockError);

      const { result } = renderHook(() => useItemActions('board-1'));

      await act(async () => {
        await result.current.handleItemDrop(mockItem);
      });

      expect(mockHandleError).toHaveBeenCalledWith(mockError, 'カード位置の更新に失敗しました');
    });

    it('boardIdがundefinedでも更新できること', async () => {
      // handleItemDropはboardIdを使用しないので、undefinedでも動作する
      mockUpdateItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useItemActions(undefined));

      await act(async () => {
        await result.current.handleItemDrop(mockItem);
      });

      expect(mockUpdateItem).toHaveBeenCalledWith(mockItem);
    });
  });

  describe('handleTagClick', () => {
    it('タグフィルターを設定できること', () => {
      const { result } = renderHook(() => useItemActions('board-1'));

      act(() => {
        result.current.handleTagClick('#test');
      });

      expect(mockSetFilterTag).toHaveBeenCalledWith('#test');
    });

    it('異なるタグを設定できること', () => {
      const { result } = renderHook(() => useItemActions('board-1'));

      act(() => {
        result.current.handleTagClick('#doc');
      });

      expect(mockSetFilterTag).toHaveBeenCalledWith('#doc');
    });
  });

  describe('handleMemberClick', () => {
    it('メンバーフィルターを設定できること', () => {
      const { result } = renderHook(() => useItemActions('board-1'));

      act(() => {
        result.current.handleMemberClick('user-1');
      });

      expect(mockSetFilterMemberId).toHaveBeenCalledWith('user-1');
    });

    it('異なるメンバーを設定できること', () => {
      const { result } = renderHook(() => useItemActions('board-1'));

      act(() => {
        result.current.handleMemberClick('user-2');
      });

      expect(mockSetFilterMemberId).toHaveBeenCalledWith('user-2');
    });
  });

  describe('handleVote', () => {
    it('投票を正常にトグルできること', async () => {
      mockToggleVote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useItemActions('board-1'));

      await act(async () => {
        await result.current.handleVote('item-1');
      });

      expect(mockToggleVote).toHaveBeenCalledWith('item-1');
    });

    it('投票に失敗した場合、handleErrorが呼び出されること', async () => {
      const mockError = new APIError('投票に失敗しました', 500);
      mockToggleVote.mockRejectedValue(mockError);

      const { result } = renderHook(() => useItemActions('board-1'));

      await act(async () => {
        await result.current.handleVote('item-1');
      });

      expect(mockHandleError).toHaveBeenCalledWith(mockError, '投票に失敗しました');
    });
  });

  describe('boardIdの変更', () => {
    it('boardIdが変更された場合、新しいboardIdで削除が実行されること', async () => {
      mockDeleteItem.mockResolvedValue(undefined);

      const { result, rerender } = renderHook(({ boardId }) => useItemActions(boardId), {
        initialProps: { boardId: 'board-1' },
      });

      await act(async () => {
        await result.current.handleDeleteItem('item-1');
      });

      expect(mockDeleteItem).toHaveBeenCalledWith('item-1', 'board-1');

      // boardIdを変更
      rerender({ boardId: 'board-2' });

      await act(async () => {
        await result.current.handleDeleteItem('item-2');
      });

      expect(mockDeleteItem).toHaveBeenCalledWith('item-2', 'board-2');
    });
  });
});
