import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import i18n from '@/i18n';

import type { BoardMember, KptColumnType, KptItem, TimerState, TryStatus } from '@/types/kpt';

interface FilterState {
  tag: string | null;
  memberId: string | null;
}

// デモ用のダミーメンバーを生成する関数
function createDemoMembers(): BoardMember[] {
  return [
    { id: 'member-1', userId: 'demo-user-1', nickname: i18n.t('board:デモユーザー1'), role: 'owner', createdAt: new Date().toISOString() },
    { id: 'member-2', userId: 'demo-user-2', nickname: i18n.t('board:デモユーザー2'), role: 'member', createdAt: new Date().toISOString() },
    { id: 'member-3', userId: 'demo-user-3', nickname: i18n.t('board:デモユーザー3'), role: 'member', createdAt: new Date().toISOString() },
  ];
}

// サマリー生成時に除外するアイテム
export const DEMO_EXPLANATION_ITEM_IDS = ['demo-keep-1', 'demo-keep-2'];

// デモ用の初期データを生成する関数
function createInitialItems(): KptItem[] {
  const user1 = i18n.t('board:デモユーザー1');
  const user2 = i18n.t('board:デモユーザー2');
  const user3 = i18n.t('board:デモユーザー3');

  return [
    {
      id: 'demo-keep-1',
      boardId: 'demo',
      column: 'keep',
      text: i18n.t('board:デモKeep1'),
      position: 100,
      authorId: 'demo-user-1',
      authorNickname: user1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-keep-2',
      boardId: 'demo',
      column: 'keep',
      text: i18n.t('board:デモKeep2'),
      position: 200,
      authorId: 'demo-user-3',
      authorNickname: user3,
      createdAt: new Date().toISOString(),
      voteCount: 1,
      hasVoted: true,
      voters: [{ id: 'demo-user-1', nickname: user1 }],
    },
    {
      id: 'demo-keep-3',
      boardId: 'demo',
      column: 'keep',
      text: i18n.t('board:デモKeep3'),
      position: 300,
      authorId: 'demo-user-2',
      authorNickname: user2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-problem-1',
      boardId: 'demo',
      column: 'problem',
      text: i18n.t('board:デモProblem1'),
      position: 1000,
      authorId: 'demo-user-1',
      authorNickname: user1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-problem-2',
      boardId: 'demo',
      column: 'problem',
      text: i18n.t('board:デモProblem2'),
      position: 2000,
      authorId: 'demo-user-3',
      authorNickname: user3,
      createdAt: new Date().toISOString(),
      voteCount: 2,
      hasVoted: false,
      voters: [
        { id: 'demo-user-2', nickname: user2 },
        { id: 'demo-user-3', nickname: user3 },
      ],
    },
    {
      id: 'demo-try-1',
      boardId: 'demo',
      column: 'try',
      text: i18n.t('board:デモTry1'),
      position: 1000,
      authorId: 'demo-user-2',
      authorNickname: user2,
      status: 'pending' as TryStatus,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-try-2',
      boardId: 'demo',
      column: 'try',
      text: i18n.t('board:デモTry2'),
      position: 2000,
      authorId: 'demo-user-1',
      authorNickname: user1,
      status: 'in_progress' as TryStatus,
      assigneeId: 'demo-user-3',
      assigneeNickname: user3,
      dueDate: '2026-02-28',
      createdAt: new Date().toISOString(),
      voteCount: 3,
      hasVoted: true,
      voters: [
        { id: 'demo-user-1', nickname: user1 },
        { id: 'demo-user-2', nickname: user2 },
        { id: 'demo-user-3', nickname: user3 },
      ],
    },
  ];
}

// memberNicknameMapを生成する関数
function createMemberNicknameMap(): Record<string, string> {
  return Object.fromEntries(createDemoMembers().map((m) => [m.userId, m.nickname ?? '']));
}

// エクスポート用のDEMO_MEMBERSゲッター
export function getDemoMembers(): BoardMember[] {
  return createDemoMembers();
}

interface DemoState {
  items: KptItem[];
  selectedItem: KptItem | null;
  filter: FilterState;
  timerState: TimerState | null;
  memberNicknameMap: Record<string, string>;

  addItem: (column: KptColumnType, text: string) => void;
  updateItem: (item: KptItem) => void;
  deleteItem: (id: string) => void;
  setSelectedItem: (item: KptItem | null) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterMemberId: (memberId: string | null) => void;
  startTimer: (durationSeconds: number, hideOthersCards: boolean) => void;
  stopTimer: () => void;
  toggleVote: (itemId: string) => void;
  reset: () => void;
  refreshTranslations: () => void;
}

const initialFilterState: FilterState = {
  tag: null,
  memberId: null,
};

export const useDemoStore = create<DemoState>()(
  devtools(
    immer((set, get) => ({
      items: createInitialItems(),
      selectedItem: null,
      filter: initialFilterState,
      timerState: null,
      memberNicknameMap: createMemberNicknameMap(),

      addItem: (column: KptColumnType, text: string) => {
        const columnItems = get().items.filter((item) => item.column === column);
        const maxPosition = columnItems.length > 0 ? Math.max(...columnItems.map((item) => item.position)) : 0;

        const newItem: KptItem = {
          id: `demo-${Date.now()}`,
          boardId: 'demo',
          column,
          text,
          position: maxPosition + 1000,
          authorId: 'demo-user-1',
          authorNickname: i18n.t('board:デモユーザー1'),
          createdAt: new Date().toISOString(),
          status: column === 'try' ? 'pending' : undefined,
        };

        set((state) => {
          state.items.push(newItem);
        });
      },

      updateItem: (item: KptItem) => {
        set((state) => {
          const index = state.items.findIndex((i) => i.id === item.id);
          if (index !== -1) {
            state.items[index] = { ...item, updatedAt: new Date().toISOString() };
          }
          if (state.selectedItem?.id === item.id) {
            state.selectedItem = { ...item, updatedAt: new Date().toISOString() };
          }
        });
      },

      deleteItem: (id: string) => {
        set((state) => {
          state.items = state.items.filter((item) => item.id !== id);
          if (state.selectedItem?.id === id) {
            state.selectedItem = null;
          }
        });
      },

      setSelectedItem: (item: KptItem | null) => {
        set({ selectedItem: item });
      },

      setFilterTag: (tag: string | null) => {
        set((state) => {
          state.filter.tag = tag;
        });
      },

      setFilterMemberId: (memberId: string | null) => {
        set((state) => {
          state.filter.memberId = memberId;
        });
      },

      startTimer: (durationSeconds: number, hideOthersCards: boolean) => {
        const timerState: TimerState = {
          startedAt: new Date().toISOString(),
          durationSeconds,
          hideOthersCards,
          startedBy: 'demo-user-1',
        };
        set({ timerState });
      },

      stopTimer: () => {
        set({ timerState: null });
      },

      toggleVote: (itemId: string) => {
        set((state) => {
          const index = state.items.findIndex((i) => i.id === itemId);
          if (index !== -1) {
            const item = state.items[index];
            const oldVoteCount = item.voteCount ?? 0;
            const oldHasVoted = item.hasVoted ?? false;
            const oldVoters = item.voters ?? [];
            const newHasVoted = !oldHasVoted;
            const newVoteCount = newHasVoted ? oldVoteCount + 1 : Math.max(0, oldVoteCount - 1);

            // デモユーザーの投票者情報
            const demoVoter = { id: 'demo-user-1', nickname: i18n.t('board:デモユーザー1') };
            const newVoters = newHasVoted ? [...oldVoters, demoVoter] : oldVoters.filter((v) => v.id !== demoVoter.id);

            state.items[index].voteCount = newVoteCount;
            state.items[index].hasVoted = newHasVoted;
            state.items[index].voters = newVoters;

            if (state.selectedItem?.id === itemId) {
              state.selectedItem.voteCount = newVoteCount;
              state.selectedItem.hasVoted = newHasVoted;
              state.selectedItem.voters = newVoters;
            }
          }
        });
      },

      reset: () => {
        set({
          items: createInitialItems(),
          selectedItem: null,
          filter: initialFilterState,
          timerState: null,
          memberNicknameMap: createMemberNicknameMap(),
        });
      },

      // 言語変更時に翻訳を更新
      refreshTranslations: () => {
        set({
          items: createInitialItems(),
          memberNicknameMap: createMemberNicknameMap(),
        });
      },
    })),
    { name: 'DemoStore', enabled: import.meta.env.DEV }
  )
);

// 言語変更時にデモストアを更新
i18n.on('languageChanged', () => {
  useDemoStore.getState().refreshTranslations();
});
