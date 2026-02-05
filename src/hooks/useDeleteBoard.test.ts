import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError } from '@/lib/api-error';

import { useDeleteBoard } from './useDeleteBoard';

vi.mock('@/i18n', () => ({
  default: {
    t: (key: string) => key.replace('error:', ''),
  },
}));

vi.mock('@/lib/kpt-api', () => ({
  deleteBoard: vi.fn(),
}));

const mockHandleError = vi.fn();
vi.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: mockHandleError,
  }),
}));

describe('useDeleteBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleDeleteBoard', () => {
    it('ボードを正常に削除できること', async () => {
      const { deleteBoard } = await import('@/lib/kpt-api');
      vi.mocked(deleteBoard).mockResolvedValue(undefined);

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      await act(async () => {
        await result.current.handleDeleteBoard('board-1');
      });

      expect(deleteBoard).toHaveBeenCalledWith('board-1');
      expect(mockOnSuccess).toHaveBeenCalledWith('board-1');
    });

    it('削除中にdeletingBoardIdが設定されること', async () => {
      const { deleteBoard } = await import('@/lib/kpt-api');
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      vi.mocked(deleteBoard).mockReturnValue(deletePromise);

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      // 削除開始
      act(() => {
        result.current.handleDeleteBoard('board-1');
      });

      // 削除中はdeletingBoardIdが設定されている
      expect(result.current.deletingBoardId).toBe('board-1');

      // 削除完了
      await act(async () => {
        resolveDelete!();
        await deletePromise;
      });

      // 削除完了後はnullに戻る
      await waitFor(() => {
        expect(result.current.deletingBoardId).toBeNull();
      });
    });

    it('削除に失敗した場合、handleErrorが呼び出されること', async () => {
      const { deleteBoard } = await import('@/lib/kpt-api');
      const mockError = new APIError('削除に失敗しました', 500);
      vi.mocked(deleteBoard).mockRejectedValue(mockError);

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      await act(async () => {
        await result.current.handleDeleteBoard('board-1');
      });

      expect(mockHandleError).toHaveBeenCalledWith(mockError, 'ボードの削除に失敗しました');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('削除に失敗してもdeletingBoardIdがnullに戻ること', async () => {
      const { deleteBoard } = await import('@/lib/kpt-api');
      vi.mocked(deleteBoard).mockRejectedValue(new Error('エラー'));

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      await act(async () => {
        await result.current.handleDeleteBoard('board-1');
      });

      expect(result.current.deletingBoardId).toBeNull();
    });

    it('onSuccessがPromiseを返す場合、正しく処理されること', async () => {
      const { deleteBoard } = await import('@/lib/kpt-api');
      vi.mocked(deleteBoard).mockResolvedValue(undefined);

      const mockOnSuccess = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      await act(async () => {
        await result.current.handleDeleteBoard('board-1');
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('board-1');
      expect(result.current.deletingBoardId).toBeNull();
    });

    it('onSuccessでエラーが発生した場合、handleErrorが呼び出されること', async () => {
      const { deleteBoard } = await import('@/lib/kpt-api');
      vi.mocked(deleteBoard).mockResolvedValue(undefined);

      const mockError = new Error('onSuccessエラー');
      const mockOnSuccess = vi.fn().mockRejectedValue(mockError);
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      await act(async () => {
        await result.current.handleDeleteBoard('board-1');
      });

      expect(mockHandleError).toHaveBeenCalledWith(mockError, 'ボードの削除に失敗しました');
    });

    it('複数のボードを順次削除できること', async () => {
      const { deleteBoard } = await import('@/lib/kpt-api');
      vi.mocked(deleteBoard).mockResolvedValue(undefined);

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      await act(async () => {
        await result.current.handleDeleteBoard('board-1');
      });

      await act(async () => {
        await result.current.handleDeleteBoard('board-2');
      });

      expect(deleteBoard).toHaveBeenCalledTimes(2);
      expect(deleteBoard).toHaveBeenNthCalledWith(1, 'board-1');
      expect(deleteBoard).toHaveBeenNthCalledWith(2, 'board-2');
      expect(mockOnSuccess).toHaveBeenCalledTimes(2);
    });
  });

  describe('初期状態', () => {
    it('deletingBoardIdがnullであること', () => {
      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() => useDeleteBoard({ onSuccess: mockOnSuccess }));

      expect(result.current.deletingBoardId).toBeNull();
    });
  });
});
