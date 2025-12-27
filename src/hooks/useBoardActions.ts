import { useCallback, useState } from 'react';

import { createKptItem, deleteKptItem, updateKptItem } from '@/lib/kpt-api';

import type { KptColumnType, KptItem } from '@/types/kpt';

interface UseBoardActionsOptions {
  boardId: string | undefined;
  setItems: React.Dispatch<React.SetStateAction<KptItem[]>>;
  onError?: (message: string) => void;
}

/**
 * ボードのCRUD操作を管理するフック
 */
export function useBoardActions({ boardId, setItems, onError }: UseBoardActionsOptions) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = useCallback(
    async (column: KptColumnType, text: string) => {
      if (!boardId) {
        onError?.('ボードが見つかりません。');
        return;
      }

      try {
        setIsAdding(true);
        const newItem = await createKptItem({ boardId, column, text });
        setItems((prev) => [...prev, newItem]);
      } catch (error) {
        onError?.('カードの追加に失敗しました。');
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [boardId, setItems, onError]
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      if (!boardId) {
        onError?.('ボードが見つかりません。');
        return;
      }

      try {
        // オプティミスティック削除
        setItems((prev) => prev.filter((item) => item.id !== id));
        await deleteKptItem(id, boardId);
      } catch (error) {
        onError?.('カードの削除に失敗しました。');
        throw error;
      }
    },
    [boardId, setItems, onError]
  );

  const handleUpdateItem = useCallback(
    async (item: KptItem) => {
      if (!boardId) return;

      try {
        await updateKptItem({
          id: item.id,
          boardId,
          column: item.column,
          text: item.text,
        });
      } catch (error) {
        onError?.('カード位置の更新に失敗しました。');
        throw error;
      }
    },
    [boardId, onError]
  );

  return {
    isAdding,
    handleAddItem,
    handleDeleteItem,
    handleUpdateItem,
  };
}
