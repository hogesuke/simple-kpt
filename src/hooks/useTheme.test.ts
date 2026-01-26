import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTheme } from './useTheme';

describe('useTheme', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();

    mediaQueryListeners = [];
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      addEventListener: vi.fn((_event: string, callback: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners.push(callback);
      }),
      removeEventListener: vi.fn((_event: string, callback: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners = mediaQueryListeners.filter((cb) => cb !== callback);
      }),
    }));
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });

    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('localStorageに設定がない場合、themeが"system"になること', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });

    it('localStorageに"light"が保存されている場合、themeが"light"になること', () => {
      localStorageMock.setItem('theme', 'light');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
    });

    it('localStorageに"dark"が保存されている場合、themeが"dark"になること', () => {
      localStorageMock.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('localStorageに不正な値が保存されている場合、themeが"system"になること', () => {
      localStorageMock.setItem('theme', 'invalid');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });
  });

  describe('setTheme', () => {
    it('テーマを"light"に設定できること', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('テーマを"dark"に設定できること', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('テーマを"system"に設定できること', () => {
      localStorageMock.setItem('theme', 'light');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'system');
    });
  });

  describe('resolvedTheme', () => {
    it('themeが"light"の場合、resolvedThemeが"light"になること', () => {
      localStorageMock.setItem('theme', 'light');

      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('themeが"dark"の場合、resolvedThemeが"dark"になること', () => {
      localStorageMock.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('themeが"system"でシステムがライトモードの場合、resolvedThemeが"light"になること', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('themeが"system"でシステムがダークモードの場合、resolvedThemeが"dark"になること', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  describe('DOMクラスの適用', () => {
    it('darkテーマの場合、html要素に"dark"クラスが追加されること', () => {
      localStorageMock.setItem('theme', 'dark');

      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('lightテーマの場合、html要素から"dark"クラスが削除されること', () => {
      document.documentElement.classList.add('dark');
      localStorageMock.setItem('theme', 'light');

      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('setThemeでテーマを変更すると、DOMが更新されること', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('システムテーマの監視', () => {
    it('themeが"system"の場合、matchMediaのイベントリスナーが登録されること', () => {
      const addEventListenerMock = vi.fn();
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
      }));

      renderHook(() => useTheme());

      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('themeが"light"の場合、matchMediaのイベントリスナーが登録されないこと', () => {
      localStorageMock.setItem('theme', 'light');
      const addEventListenerMock = vi.fn();
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
      }));

      renderHook(() => useTheme());

      expect(addEventListenerMock).not.toHaveBeenCalled();
    });

    it('アンマウント時にイベントリスナーが削除されること', () => {
      const removeEventListenerMock = vi.fn();
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerMock,
      }));

      const { unmount } = renderHook(() => useTheme());
      unmount();

      expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});
