import { useEffect, useState } from 'react';

import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { fetchBoard, fetchKptItems } from '@/lib/kpt-api';

import type { KptBoard, KptItem } from '@/types/kpt';

/**
 * ボードデータの取得とリアルタイム更新を管理するフック
 */
export function useBoardData(boardId: string | undefined) {
  const [board, setBoard] = useState<KptBoard | null>(null);
  const [items, setItems] = useState<KptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const [boardData, itemData] = await Promise.all([fetchBoard(boardId), fetchKptItems(boardId)]);
        setBoard(boardData);
        setItems(itemData);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [boardId]);

  // リアルタイム更新の購読
  useRealtimeUpdates({
    boardId: boardId ?? '',
    onItemsChange: setItems,
  });

  return { board, items, setItems, isLoading };
}
