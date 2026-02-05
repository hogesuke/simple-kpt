import { useCallback } from 'react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import i18n from '@/i18n';
import { useBoardStore } from '@/stores/useBoardStore';

import type { KptItem } from '@/types/kpt';

/**
 * KPTボードのアイテム操作に関するコールバックをまとめたカスタムフック
 *
 * NOTE: URL操作を伴うhandleCardClick/handleClosePanelはこのファイルに入れていない
 *       複数箇所での呼び出しでURL更新が競合してしまうため、KPTBoard内で同一useSearchParamsのパラメータを参照させるようにしている
 */
export function useItemActions(boardId: string | undefined) {
  const { handleError } = useErrorHandler();

  const deleteItem = useBoardStore((state) => state.deleteItem);
  const updateItem = useBoardStore((state) => state.updateItem);
  const setFilterTag = useBoardStore((state) => state.setFilterTag);
  const setFilterMemberId = useBoardStore((state) => state.setFilterMemberId);
  const toggleVote = useBoardStore((state) => state.toggleVote);

  const handleDeleteItem = useCallback(
    async (id: string) => {
      if (!boardId) return;
      try {
        await deleteItem(id, boardId);
      } catch (error) {
        handleError(error, i18n.t('error:カードの削除に失敗しました'));
      }
    },
    [boardId, deleteItem, handleError]
  );

  const handleItemDrop = useCallback(
    async (item: KptItem) => {
      try {
        await updateItem(item);
      } catch (error) {
        handleError(error, i18n.t('error:カード位置の更新に失敗しました'));
      }
    },
    [updateItem, handleError]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      setFilterTag(tag);
    },
    [setFilterTag]
  );

  const handleMemberClick = useCallback(
    (memberId: string) => {
      setFilterMemberId(memberId);
    },
    [setFilterMemberId]
  );

  const handleVote = useCallback(
    async (itemId: string) => {
      try {
        await toggleVote(itemId);
      } catch (error) {
        handleError(error, i18n.t('error:投票に失敗しました'));
      }
    },
    [toggleVote, handleError]
  );

  return {
    handleDeleteItem,
    handleItemDrop,
    handleTagClick,
    handleMemberClick,
    handleVote,
  };
}
