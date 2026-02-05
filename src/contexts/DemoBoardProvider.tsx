import { ReactNode, useCallback, useMemo } from 'react';

import { BoardContextProvider, BoardContextValue } from '@/contexts/BoardContext';
import { getDemoMembers, useDemoStore } from '@/stores/useDemoStore';

import type { KptItem } from '@/types/kpt';

interface DemoBoardProviderProps {
  children: ReactNode;
}

// デモユーザーID
const DEMO_USER_ID = 'demo-user-1';

export function DemoBoardProvider({ children }: DemoBoardProviderProps) {
  const items = useDemoStore((state) => state.items);
  const selectedItem = useDemoStore((state) => state.selectedItem);
  const filter = useDemoStore((state) => state.filter);
  const timerState = useDemoStore((state) => state.timerState);
  const memberNicknameMap = useDemoStore((state) => state.memberNicknameMap);
  const addItem = useDemoStore((state) => state.addItem);
  const updateItem = useDemoStore((state) => state.updateItem);
  const deleteItem = useDemoStore((state) => state.deleteItem);
  const setSelectedItem = useDemoStore((state) => state.setSelectedItem);
  const setFilterTag = useDemoStore((state) => state.setFilterTag);
  const setFilterMemberId = useDemoStore((state) => state.setFilterMemberId);
  const startTimer = useDemoStore((state) => state.startTimer);
  const stopTimer = useDemoStore((state) => state.stopTimer);
  const toggleVote = useDemoStore((state) => state.toggleVote);

  const setItems = useCallback((newItems: KptItem[]) => {
    useDemoStore.setState({ items: newItems });
  }, []);

  // memberNicknameMapが更新されたらmembersも再取得（言語変更時に更新される）
  // eslint-disable-next-line react-hooks/exhaustive-deps -- memberNicknameMapの更新を検知して言語変更時に再取得
  const members = useMemo(() => getDemoMembers(), [memberNicknameMap]);

  const value: BoardContextValue = useMemo(
    () => ({
      items,
      selectedItem,
      filter,
      timerState,
      memberNicknameMap,
      members,
      isLoading: false,
      addItem,
      updateItem,
      deleteItem,
      setSelectedItem,
      setItems,
      setFilterTag,
      setFilterMemberId,
      startTimer,
      stopTimer,
      toggleVote,
      isDemo: true,
      currentUserId: DEMO_USER_ID,
    }),
    [
      items,
      selectedItem,
      filter,
      timerState,
      memberNicknameMap,
      members,
      addItem,
      updateItem,
      deleteItem,
      setSelectedItem,
      setItems,
      setFilterTag,
      setFilterMemberId,
      startTimer,
      stopTimer,
      toggleVote,
    ]
  );

  return <BoardContextProvider value={value}>{children}</BoardContextProvider>;
}
