import { ReactNode } from 'react';

import { BoardContextProvider, BoardContextValue } from '@/contexts/BoardContext';

import type { BoardMember, KptItem } from '@/types/kpt';

// サンプルアイテム
export const mockItems: KptItem[] = [
  {
    id: '1',
    boardId: 'board-1',
    column: 'keep',
    text: '障害発生時の対応フローが確立されている',
    position: 0,
    authorId: 'user-1',
    authorNickname: 'user1',
    createdAt: new Date().toISOString(),
    voteCount: 2,
    hasVoted: true,
    voters: [
      { id: 'user-1', nickname: 'user1' },
      { id: 'user-2', nickname: 'user2' },
    ],
  },
  {
    id: '2',
    boardId: 'board-1',
    column: 'problem',
    text: 'ドキュメントが不足している',
    position: 0,
    authorId: 'user-2',
    authorNickname: 'user2',
    createdAt: new Date().toISOString(),
    voteCount: 1,
    hasVoted: false,
    voters: [{ id: 'user-1', nickname: 'user1' }],
  },
  {
    id: '3',
    boardId: 'board-1',
    column: 'try',
    text: 'タスク管理ツールを導入する',
    position: 0,
    authorId: 'user-1',
    authorNickname: 'user1',
    createdAt: new Date().toISOString(),
    voteCount: 3,
    hasVoted: true,
    voters: [
      { id: 'user-1', nickname: 'user1' },
      { id: 'user-2', nickname: 'user2' },
      { id: 'user-3', nickname: 'user3' },
    ],
    status: 'in_progress',
    assigneeNickname: 'user1',
    dueDate: '2026-02-01',
  },
];

// サンプルメンバー
export const mockMembers: BoardMember[] = [
  { id: 'member-1', userId: 'user-1', nickname: 'user1', role: 'owner', createdAt: new Date().toISOString() },
  { id: 'member-2', userId: 'user-2', nickname: 'user2', role: 'member', createdAt: new Date().toISOString() },
  { id: 'member-3', userId: 'user-3', nickname: 'user3', role: 'member', createdAt: new Date().toISOString() },
];

// デフォルトのモック値
export const defaultMockBoardContext: BoardContextValue = {
  // State
  items: mockItems,
  selectedItem: null,
  filter: { tag: null, memberId: null },
  timerState: null,
  memberNicknameMap: {
    'user-1': 'user1',
    'user-2': 'user2',
    'user-3': 'user3',
  },
  members: mockMembers,
  isLoading: false,

  // アイテム操作（no-op）
  addItem: async () => {},
  updateItem: async () => {},
  deleteItem: async () => {},
  setSelectedItem: () => {},
  setItems: () => {},
  toggleVote: async () => {},

  // フィルター操作（no-op）
  setFilterTag: () => {},
  setFilterMemberId: () => {},

  // タイマー操作（no-op）
  startTimer: async () => {},
  stopTimer: async () => {},

  // フラグ
  isDemo: true,
  currentUserId: 'user-1',
};

interface MockBoardProviderProps {
  children: ReactNode;
  value?: Partial<BoardContextValue>;
}

/**
 * Storybook用のBoardContextモックプロバイダー
 */
export function MockBoardProvider({ children, value = {} }: MockBoardProviderProps) {
  const contextValue: BoardContextValue = {
    ...defaultMockBoardContext,
    ...value,
  };

  return <BoardContextProvider value={contextValue}>{children}</BoardContextProvider>;
}
