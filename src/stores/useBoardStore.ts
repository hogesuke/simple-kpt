import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import * as api from '@/lib/kpt-api';
import { APIError } from '@/lib/kpt-api';
import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';

import type { ItemRow } from '@/types/db';
import type { KptBoard, KptColumnType, KptItem, TryStatus } from '@/types/kpt';
import type {
  RealtimeChannel,
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';

interface FilterState {
  tag: string | null;
  memberId: string | null;
}

interface BoardState {
  currentBoard: KptBoard | null;
  items: KptItem[];
  selectedItem: KptItem | null;
  isLoading: boolean;
  isAdding: boolean;
  loadError: string | null;
  joinError: string | null;
  isNotFound: boolean;
  realtimeChannel: RealtimeChannel | null;
  memberNicknameMap: Record<string, string>; // userId -> nickname へ変換するマップ
  filter: FilterState;

  loadBoard: (boardId: string) => Promise<void>;
  joinBoard: (boardId: string) => Promise<void>;
  addItem: (boardId: string, column: KptColumnType, text: string) => Promise<void>;
  updateItem: (item: KptItem) => Promise<void>;
  deleteItem: (id: string, boardId: string) => Promise<void>;
  subscribeToRealtime: (boardId: string) => void;
  unsubscribeFromRealtime: () => void;
  fetchAndCacheNickname: (boardId: string, userId: string) => Promise<string | null>;
  handleRealtimeInsert: (item: KptItem) => Promise<void>;
  handleRealtimeUpdate: (item: KptItem) => void;
  handleRealtimeDelete: (id: string) => void;
  setSelectedItem: (item: KptItem | null) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterMemberId: (memberId: string | null) => void;
  reset: () => void;
}

const mapRowToItem = (row: ItemRow): KptItem => ({
  id: row.id,
  boardId: row.board_id,
  column: row.column_name as KptColumnType,
  text: row.text,
  position: row.position,
  authorId: row.author_id,
  authorNickname: null, // Realtimeではnicknameは取得できないためnull
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: row.status as TryStatus | null,
  assigneeId: row.assignee_id,
  assigneeNickname: null, // Realtimeではnicknameは取得できないためnull
  dueDate: row.due_date,
});

/**
 * アイテムをpositionでソートする
 */
const sortItemsByPosition = (items: KptItem[]): KptItem[] => {
  return [...items].sort((a, b) => a.position - b.position);
};

const initialFilterState: FilterState = {
  tag: null,
  memberId: null,
};

export const useBoardStore = create<BoardState>()(
  devtools(
    immer((set, get) => ({
      currentBoard: null,
      items: [],
      selectedItem: null,
      isLoading: false,
      isAdding: false,
      loadError: null,
      joinError: null,
      isNotFound: false,
      realtimeChannel: null,
      memberNicknameMap: {},
      filter: initialFilterState,

      loadBoard: async (boardId: string) => {
        set({ isLoading: true, loadError: null, joinError: null, isNotFound: false });
        try {
          const buildNicknameMap = async (): Promise<Record<string, string>> => {
            try {
              const members = await api.fetchBoardMembers(boardId);
              return Object.fromEntries(members.map((member) => [member.userId, member.nickname ?? '']));
            } catch {
              return {};
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
            const nicknameMap = await buildNicknameMap();

            set({ currentBoard: updatedBoard, items, memberNicknameMap: nicknameMap, isLoading: false });
          } else {
            const items = await api.fetchKptItems(boardId);
            const nicknameMap = await buildNicknameMap();

            set({ currentBoard: board, items, memberNicknameMap: nicknameMap, isLoading: false });
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
        } catch (error) {
          // エラー時はロールバックする
          set({ items: oldItems, selectedItem: oldSelectedItem });
          throw error;
        }
      },

      subscribeToRealtime: (boardId: string) => {
        // 既存のチャンネルがすでにある場合はサブスクリプションを解除する
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
        }

        const channel = supabase
          .channel(`kpt-items-${boardId}`, {
            config: {
              broadcast: { self: false },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'items',
              filter: `board_id=eq.${boardId}`,
            },
            (payload: RealtimePostgresInsertPayload<ItemRow>) => {
              const newItem = mapRowToItem(payload.new);
              // 自分が追加したアイテム（楽観的更新）の場合はスキップ
              const currentUserId = useAuthStore.getState().user?.id;
              if (newItem.authorId !== currentUserId) {
                get().handleRealtimeInsert(newItem);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'items',
              filter: `board_id=eq.${boardId}`,
            },
            (payload: RealtimePostgresUpdatePayload<ItemRow>) => {
              const updatedItem = mapRowToItem(payload.new);
              get().handleRealtimeUpdate(updatedItem);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'items',
            },
            (payload: RealtimePostgresDeletePayload<ItemRow>) => {
              if (payload.old?.id) {
                // DELETEイベントではRLSによりboard_idが取得できないため、
                // クライアント側で現在のボードのアイテムかどうかをチェックする
                const existItem = get().items.some((item) => item.id === payload.old.id);
                if (existItem) {
                  get().handleRealtimeDelete(payload.old.id);
                }
              }
            }
          )
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

        set({ realtimeChannel: channel });
      },

      unsubscribeFromRealtime: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          set({ realtimeChannel: null });
        }
      },

      fetchAndCacheNickname: async (boardId: string, userId: string): Promise<string | null> => {
        try {
          const members = await api.fetchBoardMembers(boardId);
          const member = members.find((m) => m.userId === userId);

          if (member) {
            const nickname = member.nickname ?? '';
            // キャッシュを更新
            set((state) => {
              state.memberNicknameMap[userId] = nickname;
            });
            return nickname || null;
          }
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
            // Realtimeではnicknameを取得できないため、既存のitemから取得する
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

      reset: () => {
        const { unsubscribeFromRealtime } = get();
        unsubscribeFromRealtime();
        set({
          currentBoard: null,
          items: [],
          selectedItem: null,
          isLoading: false,
          isAdding: false,
          loadError: null,
          isNotFound: false,
          realtimeChannel: null,
          memberNicknameMap: {},
          filter: initialFilterState,
        });
      },
    })),
    { name: 'BoardStore' }
  )
);
