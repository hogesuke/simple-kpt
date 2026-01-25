import { ReactNode, useEffect } from 'react';

import { useBoardStore, BoardState } from '@/stores/useBoardStore';

import type { KptBoard, KptItem, TimerState } from '@/types/kpt';

// サンプルボード
export const mockBoard: KptBoard = {
  id: 'board-1',
  name: 'サンプルボード',
  ownerId: 'user-1',
  createdAt: new Date().toISOString(),
  isMember: true,
};

// サンプルアイテム
export const mockBoardItems: KptItem[] = [
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
    column: 'keep',
    text: 'テストカバレッジ80%以上を維持している #品質',
    position: 1,
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
    column: 'problem',
    text: 'ドキュメントが不足している #ドキュメント',
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
  },
  {
    id: '4',
    boardId: 'board-1',
    column: 'problem',
    text: 'レガシーコードの技術的負債が溜まっている',
    position: 1,
    authorId: 'user-2',
    authorNickname: 'user2',
    createdAt: new Date().toISOString(),
    voteCount: 0,
    hasVoted: false,
    voters: [],
  },
  {
    id: '5',
    boardId: 'board-1',
    column: 'try',
    text: 'タスク管理ツールを導入する #ツール',
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
    status: 'in_progress',
    assigneeId: 'user-1',
    assigneeNickname: 'user1',
    dueDate: '2026-02-01',
  },
  {
    id: '6',
    boardId: 'board-1',
    column: 'try',
    text: 'ペアプログラミングを試す',
    position: 1,
    authorId: 'user-2',
    authorNickname: 'user2',
    createdAt: new Date().toISOString(),
    voteCount: 1,
    hasVoted: false,
    voters: [{ id: 'user-3', nickname: 'user3' }],
    status: 'pending',
  },
];

// メンバーニックネームマップ
export const mockMemberNicknameMap: Record<string, string> = {
  'user-1': 'user1',
  'user-2': 'user2',
  'user-3': 'user3',
};

interface MockBoardStoreState {
  currentBoard?: KptBoard | null;
  items?: KptItem[];
  selectedItem?: KptItem | null;
  isLoading?: boolean;
  memberNicknameMap?: Record<string, string>;
  timerState?: TimerState | null;
  filter?: { tag: string | null; memberId: string | null };
}

interface MockBoardStoreProviderProps {
  children: ReactNode;
  state?: MockBoardStoreState;
}

/**
 * Storybook用のBoardStoreモックプロバイダー
 * Zustandストアの状態を一時的に上書きする
 */
export function MockBoardStoreProvider({ children, state = {} }: MockBoardStoreProviderProps) {
  useEffect(() => {
    // デフォルト値とマージ
    const mockState: Partial<BoardState> = {
      currentBoard: mockBoard,
      items: mockBoardItems,
      selectedItem: null,
      isLoading: false,
      memberNicknameMap: mockMemberNicknameMap,
      timerState: null,
      filter: { tag: null, memberId: null },
      ...state,
    };

    // ストアの状態を直接設定
    useBoardStore.setState(mockState);

    // クリーンアップ時にリセット
    return () => {
      useBoardStore.setState({
        currentBoard: null,
        items: [],
        selectedItem: null,
        isLoading: false,
        memberNicknameMap: {},
        timerState: null,
        filter: { tag: null, memberId: null },
      });
    };
  }, [state]);

  return <>{children}</>;
}

/**
 * ローディング状態のモック
 */
export function MockBoardStoreProviderLoading({ children }: { children: ReactNode }) {
  return (
    <MockBoardStoreProvider
      state={{
        currentBoard: null,
        items: [],
        isLoading: true,
      }}
    >
      {children}
    </MockBoardStoreProvider>
  );
}
