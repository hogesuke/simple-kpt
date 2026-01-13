import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { BoardContextProvider, BoardContextValue } from '@/contexts/BoardContext';
import { fetchBoardMembers } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBoardStore } from '@/stores/useBoardStore';

import type { BoardMember } from '@/types/kpt';

interface BoardProviderProps {
  boardId: string;
  children: ReactNode;
}

export function BoardProvider({ boardId, children }: BoardProviderProps) {
  const user = useAuthStore((state) => state.user);

  const items = useBoardStore((state) => state.items);
  const selectedItem = useBoardStore((state) => state.selectedItem);
  const filter = useBoardStore((state) => state.filter);
  const timerState = useBoardStore((state) => state.timerState);
  const memberNicknameMap = useBoardStore((state) => state.memberNicknameMap);
  const isLoading = useBoardStore((state) => state.isLoading);
  const addItemStore = useBoardStore((state) => state.addItem);
  const updateItem = useBoardStore((state) => state.updateItem);
  const deleteItemStore = useBoardStore((state) => state.deleteItem);
  const setSelectedItem = useBoardStore((state) => state.setSelectedItem);
  const setFilterTag = useBoardStore((state) => state.setFilterTag);
  const setFilterMemberId = useBoardStore((state) => state.setFilterMemberId);
  const startTimerStore = useBoardStore((state) => state.startTimer);
  const stopTimerStore = useBoardStore((state) => state.stopTimer);

  const [members, setMembers] = useState<BoardMember[]>([]);

  // メンバー一覧を取得
  useEffect(() => {
    if (!boardId || isLoading) return;

    fetchBoardMembers(boardId).then(setMembers).catch(console.error);
  }, [boardId, isLoading]);

  const setItems = useCallback((newItems: typeof items) => {
    useBoardStore.setState({ items: newItems });
  }, []);

  const addItem = useCallback(
    (column: Parameters<typeof addItemStore>[1], text: string) => {
      return addItemStore(boardId, column, text);
    },
    [boardId, addItemStore]
  );

  const deleteItem = useCallback(
    (id: string) => {
      return deleteItemStore(id, boardId);
    },
    [boardId, deleteItemStore]
  );

  const startTimer = useCallback(
    (durationSeconds: number, hideOthersCards: boolean) => {
      return startTimerStore(boardId, durationSeconds, hideOthersCards);
    },
    [boardId, startTimerStore]
  );

  const stopTimer = useCallback(() => {
    return stopTimerStore(boardId);
  }, [boardId, stopTimerStore]);

  const value: BoardContextValue = useMemo(
    () => ({
      items,
      selectedItem,
      filter,
      timerState,
      memberNicknameMap,
      members,
      isLoading,
      addItem,
      updateItem,
      deleteItem,
      setSelectedItem,
      setItems,
      setFilterTag,
      setFilterMemberId,
      startTimer,
      stopTimer,
      isDemo: false,
      currentUserId: user?.id ?? null,
    }),
    [
      items,
      selectedItem,
      filter,
      timerState,
      memberNicknameMap,
      members,
      isLoading,
      addItem,
      updateItem,
      deleteItem,
      setSelectedItem,
      setItems,
      setFilterTag,
      setFilterMemberId,
      startTimer,
      stopTimer,
      user?.id,
    ]
  );

  return <BoardContextProvider value={value}>{children}</BoardContextProvider>;
}
