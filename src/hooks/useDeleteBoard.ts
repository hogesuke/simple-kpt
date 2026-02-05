import { useCallback, useState } from 'react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import i18n from '@/i18n';
import { deleteBoard } from '@/lib/kpt-api';

interface UseDeleteBoardOptions {
  onSuccess: (boardId: string) => void | Promise<void>;
}

/**
 * ボード削除処理を実行するフック
 */
export function useDeleteBoard({ onSuccess }: UseDeleteBoardOptions) {
  const { handleError } = useErrorHandler();
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

  const handleDeleteBoard = useCallback(
    async (boardId: string) => {
      setDeletingBoardId(boardId);

      try {
        await deleteBoard(boardId);
        await onSuccess(boardId);
      } catch (error) {
        handleError(error, i18n.t('error:ボードの削除に失敗しました'));
      } finally {
        setDeletingBoardId(null);
      }
    },
    [onSuccess, handleError]
  );

  return { handleDeleteBoard, deletingBoardId };
}
