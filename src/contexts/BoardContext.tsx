import { createContext, ReactNode, useContext } from 'react';

import type { BoardMember, KptColumnType, KptItem, TimerState } from '@/types/kpt';

interface FilterState {
  tag: string | null;
  memberId: string | null;
}

export interface BoardContextValue {
  // State
  items: KptItem[];
  selectedItem: KptItem | null;
  filter: FilterState;
  timerState: TimerState | null;
  memberNicknameMap: Record<string, string>;
  members: BoardMember[];
  isLoading: boolean;

  // アイテム操作
  addItem: (column: KptColumnType, text: string) => void | Promise<void>;
  updateItem: (item: KptItem) => void | Promise<void>;
  deleteItem: (id: string) => void | Promise<void>;
  setSelectedItem: (item: KptItem | null) => void;
  setItems: (items: KptItem[]) => void;

  // フィルター操作
  setFilterTag: (tag: string | null) => void;
  setFilterMemberId: (memberId: string | null) => void;

  // タイマー操作
  startTimer: (durationSeconds: number, hideOthersCards: boolean) => void | Promise<void>;
  stopTimer: () => void | Promise<void>;

  // デモモードフラグ
  isDemo: boolean;

  // 現在のユーザーID（他の人のカードを非表示で用いる）
  currentUserId: string | null;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoardContext(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider or DemoBoardProvider');
  }
  return context;
}

interface BoardContextProviderProps {
  value: BoardContextValue;
  children: ReactNode;
}

export function BoardContextProvider({ value, children }: BoardContextProviderProps) {
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}
