import { useCallback } from 'react';

/**
 * エラーハンドリングを実行するフック
 */
export function useErrorHandler() {
  const handleError = useCallback((message: string) => {
    // TODO: エラー時のUI表示を改善する
    window.alert(message);
  }, []);

  return { handleError };
}
