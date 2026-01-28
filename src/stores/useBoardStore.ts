import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import * as api from '@/lib/kpt-api';
import { APIError } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

import { createRealtimeSlice, RealtimeSlice } from './realtimeSlice';

import type { BoardMember, KptBoard, KptColumnType, KptItem, TimerState } from '@/types/kpt';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { StateCreator } from 'zustand';

interface FilterState {
  tag: string | null;
  memberId: string | null;
}

interface CoreSlice {
  currentBoard: KptBoard | null;
  items: KptItem[];
  selectedItem: KptItem | null;
  isLoading: boolean;
  isAdding: boolean;
  loadError: string | null;
  joinError: string | null;
  isNotFound: boolean;
  members: BoardMember[];
  memberNicknameMap: Record<string, string>;
  filter: FilterState;
  timerState: TimerState | null;

  loadBoard: (boardId: string) => Promise<void>;
  joinBoard: (boardId: string) => Promise<void>;
  addItem: (boardId: string, column: KptColumnType, text: string) => Promise<void>;
  updateItem: (item: KptItem) => Promise<void>;
  deleteItem: (id: string, boardId: string) => Promise<void>;
  setSelectedItem: (item: KptItem | null) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterMemberId: (memberId: string | null) => void;
  startTimer: (boardId: string, durationSeconds: number, hideOthersCards: boolean) => Promise<void>;
  stopTimer: (boardId: string) => Promise<void>;
  setTimerState: (state: TimerState | null) => void;
  toggleVote: (itemId: string) => Promise<void>;
  reset: () => void;
}

export interface BoardState extends CoreSlice, RealtimeSlice {
  // RealtimeSliceで使用するチャンネルの型（両方のSliceからアクセスされる）
  itemEventsChannel: RealtimeChannel | null;
  timerEventsChannel: RealtimeChannel | null;
}

const initialFilterState: FilterState = {
  tag: null,
  memberId: null,
};

const createCoreSlice: StateCreator<BoardState, [['zustand/devtools', never], ['zustand/immer', never]], [], CoreSlice> = (set, get) => ({
  currentBoard: null,
  items: [],
  selectedItem: null,
  isLoading: false,
  isAdding: false,
  loadError: null,
  joinError: null,
  isNotFound: false,
  members: [],
  memberNicknameMap: {},
  filter: initialFilterState,
  timerState: null,

  loadBoard: async (boardId: string) => {
    set({ isLoading: true, loadError: null, joinError: null, isNotFound: false });
    try {
      const fetchMembersData = async (): Promise<{ members: BoardMember[]; nicknameMap: Record<string, string> }> => {
        try {
          const members = await api.fetchBoardMembers(boardId);
          const nicknameMap = Object.fromEntries(members.map((member) => [member.userId, member.nickname ?? '']));
          return { members, nicknameMap };
        } catch {
          return { members: [], nicknameMap: {} };
        }
      };

      // まずボード情報を取得してメンバーシップを確認
      const board = await api.fetchBoard(boardId);

      // メンバーでない場合のみジョインを実行
      if (board && !board.isMember) {
        try {
          await get().joinBoard(boardId);
        } catch (joinError) {
          const message = joinError instanceof Error ? joinError.message : 'ボードへの参加に失敗しました';
          set({ isLoading: false, joinError: message });
          throw joinError;
        }

        const updatedBoard = await api.fetchBoard(boardId);
        const items = await api.fetchKptItems(boardId);
        const { members, nicknameMap } = await fetchMembersData();

        set({
          currentBoard: updatedBoard,
          items,
          members,
          memberNicknameMap: nicknameMap,
          timerState: updatedBoard?.timer ?? null,
          isLoading: false,
        });
      } else {
        const items = await api.fetchKptItems(boardId);
        const { members, nicknameMap } = await fetchMembersData();

        set({
          currentBoard: board,
          items,
          members,
          memberNicknameMap: nicknameMap,
          timerState: board?.timer ?? null,
          isLoading: false,
        });
      }
    } catch (error) {
      // joinErrorが設定済みの場合は再設定しない
      if (get().joinError) {
        throw error;
      }
      if (error instanceof APIError && error.status === 404) {
        set({ isLoading: false, isNotFound: true });
      } else {
        const message = error instanceof Error ? error.message : 'ボードの読み込みに失敗しました';
        set({ isLoading: false, loadError: message });
      }
      throw error;
    }
  },

  joinBoard: async (boardId: string) => {
    await api.joinBoard(boardId);
  },

  addItem: async (boardId: string, column: KptColumnType, text: string) => {
    // 楽観的UI更新のために仮のIDを使ってアイテムを追加する
    const tempId = `temp-${Date.now()}`;
    const { user, profile } = useAuthStore.getState();

    // 同じカラム内の最大positionを取得して、その後ろに配置する
    const columnItems = get().items.filter((item) => item.column === column);
    const maxPosition = columnItems.length > 0 ? Math.max(...columnItems.map((item) => item.position)) : 0;
    const tempPosition = maxPosition + 1000;

    const tempItem: KptItem = {
      id: tempId,
      boardId,
      column,
      text,
      position: tempPosition,
      authorId: user?.id ?? null,
      authorNickname: profile?.nickname ?? null,
    };

    set((state) => {
      state.items.push(tempItem);
      state.isAdding = true;
    });

    try {
      const newItem = await api.createKptItem({ boardId, column, text });

      // 仮のIDを本物のIDに置換する
      set((state) => {
        const index = state.items.findIndex((item: KptItem) => item.id === tempId);
        if (index !== -1) {
          state.items[index] = newItem;
        }
        state.isAdding = false;
      });
    } catch (error) {
      // エラー時はロールバックする
      set((state) => {
        state.items = state.items.filter((item: KptItem) => item.id !== tempId);
        state.isAdding = false;
      });
      throw error;
    }
  },

  updateItem: async (item: KptItem) => {
    const oldItems = get().items;
    const oldSelectedItem = get().selectedItem;

    set((state) => {
      const index = state.items.findIndex((i: KptItem) => i.id === item.id);
      if (index !== -1) {
        state.items[index] = item;
      }
      // selectedItemも更新する
      if (state.selectedItem?.id === item.id) {
        state.selectedItem = item;
      }
    });

    try {
      await api.updateKptItem({
        id: item.id,
        boardId: item.boardId,
        column: item.column,
        text: item.text,
        position: item.position,
        status: item.status,
        assigneeId: item.assigneeId,
        dueDate: item.dueDate,
      });
    } catch (error) {
      // エラー時はロールバックする
      set({ items: oldItems, selectedItem: oldSelectedItem });
      throw error;
    }
  },

  deleteItem: async (id: string, boardId: string) => {
    const oldItems = get().items;
    const oldSelectedItem = get().selectedItem;

    set((state) => {
      state.items = state.items.filter((item: KptItem) => item.id !== id);
      // 削除されたアイテムがselectedItemの場合はクリアする
      if (state.selectedItem?.id === id) {
        state.selectedItem = null;
      }
    });

    try {
      await api.deleteKptItem(id, boardId);

      // 他のクライアントに削除を通知する
      const { itemEventsChannel } = get();
      if (itemEventsChannel) {
        await itemEventsChannel.send({
          type: 'broadcast',
          event: 'item-deleted',
          payload: { itemId: id },
        });
      }
    } catch (error) {
      // エラー時はロールバックする
      set({ items: oldItems, selectedItem: oldSelectedItem });
      throw error;
    }
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

  startTimer: async (boardId: string, durationSeconds: number, hideOthersCards: boolean) => {
    const result = await api.startTimer({ boardId, durationSeconds, hideOthersCards });

    const timerState: TimerState = {
      startedAt: result.timerStartedAt,
      durationSeconds: result.durationSeconds,
      hideOthersCards: result.hideOthersCards,
      startedBy: result.startedBy,
    };

    set({ timerState });

    const { timerEventsChannel } = get();
    if (timerEventsChannel) {
      await timerEventsChannel.send({
        type: 'broadcast',
        event: 'timer-started',
        payload: timerState,
      });
    }
  },

  stopTimer: async (boardId: string) => {
    await api.stopTimer(boardId);

    set({ timerState: null });

    const { timerEventsChannel } = get();
    if (timerEventsChannel) {
      await timerEventsChannel.send({
        type: 'broadcast',
        event: 'timer-stopped',
        payload: {},
      });
    }
  },

  setTimerState: (state: TimerState | null) => {
    set({ timerState: state });
  },

  toggleVote: async (itemId: string) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;

    const { user, profile } = useAuthStore.getState();
    if (!user) return;

    // 楽観的UI更新
    const oldVoteCount = item.voteCount ?? 0;
    const oldHasVoted = item.hasVoted ?? false;
    const oldVoters = item.voters ?? [];
    const newHasVoted = !oldHasVoted;
    const newVoteCount = newHasVoted ? oldVoteCount + 1 : Math.max(0, oldVoteCount - 1);
    const newVoters = newHasVoted
      ? [...oldVoters, { id: user.id, nickname: profile?.nickname ?? null }]
      : oldVoters.filter((v) => v.id !== user.id);

    set((state) => {
      const index = state.items.findIndex((i: KptItem) => i.id === itemId);
      if (index !== -1) {
        state.items[index].voteCount = newVoteCount;
        state.items[index].hasVoted = newHasVoted;
        state.items[index].voters = newVoters;
      }
      if (state.selectedItem?.id === itemId) {
        state.selectedItem.voteCount = newVoteCount;
        state.selectedItem.hasVoted = newHasVoted;
        state.selectedItem.voters = newVoters;
      }
    });

    try {
      const result = await api.toggleVote(itemId);

      // サーバーからの応答で正確な値に更新する
      set((state) => {
        const index = state.items.findIndex((i: KptItem) => i.id === itemId);
        if (index !== -1) {
          state.items[index].voteCount = result.voteCount;
          state.items[index].hasVoted = result.hasVoted;
        }
        if (state.selectedItem?.id === itemId) {
          state.selectedItem.voteCount = result.voteCount;
          state.selectedItem.hasVoted = result.hasVoted;
        }
      });

      // 他のクライアントに投票変更を通知する
      const { itemEventsChannel } = get();
      if (itemEventsChannel) {
        await itemEventsChannel.send({
          type: 'broadcast',
          event: 'vote-changed',
          payload: {
            itemId: result.itemId,
            voteCount: result.voteCount,
            voter: {
              id: user.id,
              nickname: profile?.nickname ?? null,
              hasVoted: result.hasVoted,
            },
          },
        });
      }
    } catch (error) {
      // エラー時はロールバックを行う
      set((state) => {
        const index = state.items.findIndex((i: KptItem) => i.id === itemId);
        if (index !== -1) {
          state.items[index].voteCount = oldVoteCount;
          state.items[index].hasVoted = oldHasVoted;
          state.items[index].voters = oldVoters;
        }
        if (state.selectedItem?.id === itemId) {
          state.selectedItem.voteCount = oldVoteCount;
          state.selectedItem.hasVoted = oldHasVoted;
          state.selectedItem.voters = oldVoters;
        }
      });
      throw error;
    }
  },

  reset: () => {
    const { unsubscribeFromItemEvents, unsubscribeFromTimerEvents } = get();
    unsubscribeFromItemEvents();
    unsubscribeFromTimerEvents();
    set({
      currentBoard: null,
      items: [],
      selectedItem: null,
      isLoading: false,
      isAdding: false,
      loadError: null,
      isNotFound: false,
      itemEventsChannel: null,
      timerEventsChannel: null,
      members: [],
      memberNicknameMap: {},
      filter: initialFilterState,
      timerState: null,
    });
  },
});

export const useBoardStore = create<BoardState>()(
  devtools(
    immer((...args) => ({
      ...createCoreSlice(...args),
      ...createRealtimeSlice(...args),
    })),
    { name: 'BoardStore', enabled: import.meta.env.DEV }
  )
);
