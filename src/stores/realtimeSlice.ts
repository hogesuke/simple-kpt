import { mapRowToItem } from '@/lib/item-mapper';
import * as api from '@/lib/kpt-api';
import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';

import type { BoardState } from './useBoardStore';
import type { ItemRow } from '@/types/db';
import type { KptItem } from '@/types/kpt';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { StateCreator } from 'zustand';

export interface RealtimeSlice {
  itemEventsChannel: RealtimeChannel | null;
  timerEventsChannel: RealtimeChannel | null;

  subscribeToItemEvents: (boardId: string) => void;
  unsubscribeFromItemEvents: () => void;
  subscribeToTimerEvents: (boardId: string) => void;
  unsubscribeFromTimerEvents: () => void;
  fetchAndCacheNickname: (boardId: string, userId: string) => Promise<string | null>;
  handleRealtimeInsert: (item: KptItem) => Promise<void>;
  handleRealtimeUpdate: (item: KptItem) => void;
  handleRealtimeDelete: (id: string) => void;
  handleRealtimeVoteChanged: (
    itemId: string,
    voteCount: number,
    voter?: { id: string; nickname: string | null; hasVoted: boolean }
  ) => void;
}

/**
 * アイテムをpositionでソートする
 */
const sortItemsByPosition = (items: KptItem[]): KptItem[] => {
  return [...items].sort((a, b) => a.position - b.position);
};

export const createRealtimeSlice: StateCreator<BoardState, [['zustand/devtools', never], ['zustand/immer', never]], [], RealtimeSlice> = (
  set,
  get
) => ({
  itemEventsChannel: null,
  timerEventsChannel: null,

  subscribeToItemEvents: (boardId: string) => {
    // 既存のチャンネルがすでにある場合はサブスクリプションを解除する
    const { itemEventsChannel } = get();
    if (itemEventsChannel) {
      supabase.removeChannel(itemEventsChannel);
    }

    const channel = supabase
      .channel(`kpt-items-${boardId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      // INSERT/UPDATEを1つの購読に統合（ポーリング回数削減のため）
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresChangesPayload<ItemRow>) => {
          if (payload.eventType === 'INSERT') {
            const newItem = mapRowToItem(payload.new);
            // 自分が追加したアイテム（楽観的更新）の場合はスキップ
            const currentUserId = useAuthStore.getState().user?.id;
            if (newItem.authorId !== currentUserId) {
              get().handleRealtimeInsert(newItem);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapRowToItem(payload.new);
            get().handleRealtimeUpdate(updatedItem);
          }
        }
      )
      .on('broadcast', { event: 'vote-changed' }, (payload) => {
        const votePayload = payload.payload as {
          itemId: string;
          voteCount: number;
          voter?: { id: string; nickname: string | null; hasVoted: boolean };
        };
        get().handleRealtimeVoteChanged(votePayload.itemId, votePayload.voteCount, votePayload.voter);
      })
      // DELETEはBroadcast経由で受信（RLSの制約を回避し、該当ボードのみに通知するため）
      .on('broadcast', { event: 'item-deleted' }, (payload) => {
        const deletePayload = payload.payload as { itemId: string };
        if (deletePayload.itemId) {
          get().handleRealtimeDelete(deletePayload.itemId);
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.error('[Realtime] サブスクリプションエラー:', err);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] チャンネルエラー: ${boardId}`);
        } else if (status === 'TIMED_OUT') {
          console.error(`[Realtime] タイムアウト: ${boardId}`);
        }
      });

    set({ itemEventsChannel: channel });
  },

  unsubscribeFromItemEvents: () => {
    const { itemEventsChannel } = get();
    if (itemEventsChannel) {
      supabase.removeChannel(itemEventsChannel);
      set({ itemEventsChannel: null });
    }
  },

  subscribeToTimerEvents: (boardId: string) => {
    // 既存のチャンネルがある場合は解除
    const { timerEventsChannel } = get();
    if (timerEventsChannel) {
      supabase.removeChannel(timerEventsChannel);
    }

    const channel = supabase
      .channel(`board-timer-${boardId}`)
      .on('broadcast', { event: 'timer-started' }, (payload) => {
        const timerPayload = payload.payload as {
          startedAt: string;
          durationSeconds: number;
          hideOthersCards: boolean;
          startedBy: string;
        };
        get().setTimerState({
          startedAt: timerPayload.startedAt,
          durationSeconds: timerPayload.durationSeconds,
          hideOthersCards: timerPayload.hideOthersCards,
          startedBy: timerPayload.startedBy,
        });
      })
      .on('broadcast', { event: 'timer-stopped' }, () => {
        get().setTimerState(null);
      })
      .subscribe();

    set({ timerEventsChannel: channel });
  },

  unsubscribeFromTimerEvents: () => {
    const { timerEventsChannel } = get();
    if (timerEventsChannel) {
      supabase.removeChannel(timerEventsChannel);
      set({ timerEventsChannel: null });
    }
  },

  fetchAndCacheNickname: async (boardId: string, userId: string): Promise<string | null> => {
    try {
      const members = await api.fetchBoardMembers(boardId);
      const member = members.find((m) => m.userId === userId);

      // membersとmemberNicknameMapを更新
      set((state) => {
        state.members = members;
        state.memberNicknameMap = Object.fromEntries(members.map((m) => [m.userId, m.nickname ?? '']));
      });

      return member?.nickname ?? null;
    } catch {
      // NOOP
    }
    return null;
  },

  handleRealtimeInsert: async (item: KptItem) => {
    const state = get();

    // 重複チェック（既にあるアイテム、または一時IDのアイテムは追加しない）
    const existingItem = state.items.find(
      (i: KptItem) => i.id === item.id || (i.id.startsWith('temp-') && i.text === item.text && i.column === item.column)
    );

    if (!existingItem) {
      let nickname = item.authorId ? state.memberNicknameMap[item.authorId] : null;

      // キャッシュにない場合はAPIリクエストで取得する
      if (item.authorId && !nickname) {
        nickname = await get().fetchAndCacheNickname(item.boardId, item.authorId);
      }

      set((state) => {
        state.items.push({
          ...item,
          authorNickname: nickname,
        });
        // positionでソート
        state.items = sortItemsByPosition(state.items);
      });
    }
  },

  handleRealtimeUpdate: (item: KptItem) => {
    set((state) => {
      const index = state.items.findIndex((i: KptItem) => i.id === item.id);
      if (index !== -1) {
        const existingItem = state.items[index];
        // Realtimeではnicknameと投票情報を取得できないため、既存のitemから取得する
        // ただしassigneeIdが変更された場合は、memberNicknameMapから取得する
        const authorNickname = existingItem.authorNickname;
        let assigneeNickname = existingItem.assigneeNickname;
        if (item.assigneeId !== existingItem.assigneeId) {
          // assigneeIdが変更された場合、キャッシュから取得する
          assigneeNickname = item.assigneeId ? (state.memberNicknameMap[item.assigneeId] ?? null) : null;
        }
        const updatedItem = {
          ...item,
          authorNickname,
          assigneeNickname,
          // 投票情報はRealtimeでは取得できないため、既存の値を保持する
          voteCount: existingItem.voteCount,
          hasVoted: existingItem.hasVoted,
        };
        state.items[index] = updatedItem;

        // selectedItemも更新する
        if (state.selectedItem?.id === item.id) {
          state.selectedItem = updatedItem;
        }

        // positionでソート（カード移動時の順序同期のため）
        state.items = sortItemsByPosition(state.items);
      }
    });
  },

  handleRealtimeDelete: (id: string) => {
    set((state) => {
      state.items = state.items.filter((item: KptItem) => item.id !== id);
      // 削除されたアイテムがselectedItemの場合はクリアする
      if (state.selectedItem?.id === id) {
        state.selectedItem = null;
      }
    });
  },

  handleRealtimeVoteChanged: (itemId: string, voteCount: number, voter?: { id: string; nickname: string | null; hasVoted: boolean }) => {
    set((state) => {
      const updateVoters = (item: KptItem) => {
        if (!voter) return;
        const currentVoters = item.voters ?? [];
        if (voter.hasVoted) {
          // 投票追加: まだいなければ追加
          if (!currentVoters.some((v) => v.id === voter.id)) {
            item.voters = [...currentVoters, { id: voter.id, nickname: voter.nickname }];
          }
        } else {
          // 投票取り消し: 削除
          item.voters = currentVoters.filter((v) => v.id !== voter.id);
        }
      };

      const index = state.items.findIndex((i: KptItem) => i.id === itemId);
      if (index !== -1) {
        state.items[index].voteCount = voteCount;
        updateVoters(state.items[index]);
      }
      if (state.selectedItem?.id === itemId) {
        state.selectedItem.voteCount = voteCount;
        updateVoters(state.selectedItem);
      }
    });
  },
});
