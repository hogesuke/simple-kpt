import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { APIError } from '@/lib/api-error';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * エラーハンドリングを実行するフック
 */
export function useErrorHandler() {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);

  const handleError = useCallback(
    (error: unknown, message?: string) => {
      if (error instanceof APIError) {
        switch (error.status) {
          case 401:
            toast.error(i18n.t('error:セッションが切れました。再度ログインしてください。'));
            signOut();
            navigate('/login', { replace: true });
            return;
          case 404:
            navigate('/not-found', { replace: true });
            return;
          default:
            toast.error(error.message || message || i18n.t('error:エラーが発生しました'));
            return;
        }
      }

      // APIError以外のエラー
      const displayMessage = message || (error instanceof Error ? error.message : i18n.t('error:エラーが発生しました'));
      toast.error(displayMessage);
    },
    [navigate, signOut]
  );

  return { handleError };
}
