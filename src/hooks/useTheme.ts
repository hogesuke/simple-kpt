import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

/**
 * システムのダークモード設定を取得する
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * URLクエリパラメータからテーマを取得する（Lighthouse CI用）
 */
function getQueryTheme(): 'light' | 'dark' | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme');
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }
  return null;
}

/**
 * localStorageからテーマ設定を取得する
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * HTMLにダークモードクラスを適用する
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * テーマ管理用のカスタムフック
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  // テーマを設定する
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  // 初期化時にテーマを適用する
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // システムテーマの変更を監視
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // URLクエリパラメータによる強制的に適用するテーマ
  const queryTheme = getQueryTheme();
  const resolvedTheme = queryTheme ?? (theme === 'system' ? getSystemTheme() : theme);

  // クエリパラメータがある場合は優先的に適用
  useEffect(() => {
    if (queryTheme) {
      applyTheme(queryTheme);
    }
  }, [queryTheme]);

  return {
    theme,
    setTheme,
    resolvedTheme,
  };
}
