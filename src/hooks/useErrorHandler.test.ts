import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import { APIError } from '@/lib/api-error';

import { useErrorHandler } from './useErrorHandler';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => mockToastError(message),
  },
}));

const mockSignOut = vi.fn();
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { signOut: mockSignOut };
    return selector(state);
  }),
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('APIError (401)', () => {
    it('セッション切れメッセージを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('Unauthorized', 401);

      result.current.handleError(error);

      expect(mockToastError).toHaveBeenCalledWith(i18n.t('error:セッションが切れました。再度ログインしてください。'));
    });

    it('signOutを呼び出すこと', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('Unauthorized', 401);

      result.current.handleError(error);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('/loginにリダイレクトすること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('Unauthorized', 401);

      result.current.handleError(error);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('APIError (404)', () => {
    it('/not-foundにリダイレクトすること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('Not Found', 404);

      result.current.handleError(error);

      expect(mockNavigate).toHaveBeenCalledWith('/not-found', { replace: true });
    });

    it('トーストを表示しないこと', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('Not Found', 404);

      result.current.handleError(error);

      expect(mockToastError).not.toHaveBeenCalled();
    });
  });

  describe('APIError (その他のステータス)', () => {
    it('APIErrorのメッセージを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('サーバーエラー', 500);

      result.current.handleError(error);

      expect(mockToastError).toHaveBeenCalledWith('サーバーエラー');
    });

    it('APIErrorのメッセージがない場合はカスタムメッセージを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('', 500);

      result.current.handleError(error, 'カスタムエラーメッセージ');

      expect(mockToastError).toHaveBeenCalledWith('カスタムエラーメッセージ');
    });

    it('両方ない場合はデフォルトメッセージを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new APIError('', 500);

      result.current.handleError(error);

      expect(mockToastError).toHaveBeenCalledWith(i18n.t('error:エラーが発生しました'));
    });
  });

  describe('通常のError', () => {
    it('カスタムメッセージがある場合はそれを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('内部エラー');

      result.current.handleError(error, 'カスタムメッセージ');

      expect(mockToastError).toHaveBeenCalledWith('カスタムメッセージ');
    });

    it('カスタムメッセージがない場合はErrorのメッセージを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('内部エラー');

      result.current.handleError(error);

      expect(mockToastError).toHaveBeenCalledWith('内部エラー');
    });
  });

  describe('不明なエラー', () => {
    it('カスタムメッセージがある場合はそれを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleError('string error', 'カスタムメッセージ');

      expect(mockToastError).toHaveBeenCalledWith('カスタムメッセージ');
    });

    it('カスタムメッセージがない場合はデフォルトメッセージを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleError('string error');

      expect(mockToastError).toHaveBeenCalledWith(i18n.t('error:エラーが発生しました'));
    });

    it('nullエラーでもデフォルトメッセージを表示すること', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleError(null);

      expect(mockToastError).toHaveBeenCalledWith(i18n.t('error:エラーが発生しました'));
    });
  });
});
