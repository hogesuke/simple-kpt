import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import * as api from '@/lib/kpt-api';
import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';

import type { ItemRow } from '@/types/db';
import type { KptBoard, KptColumnType, KptItem } from '@/types/kpt';
import type {
  RealtimeChannel,
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';

interface BoardState {
  currentBoard: KptBoard | null;
  items: KptItem[];
  selectedItem: KptItem | null;
  isLoading: boolean;
  isAdding: boolean;
  realtimeChannel: RealtimeChannel | null;
  memberNicknameMap: Record<string, string>; // userId -> nickname へ変換するマップ

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
  reset: () => void;
}

const mapRowToItem = (row: ItemRow): KptItem => ({
  id: row.id,
  boardId: row.board_id,
  column: row.column_name as KptColumnType,
  text: row.text,
  authorId: row.author_id,
  authorNickname: null, // Realtime では nickname は取得できないため null
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const useBoardStore = create<BoardState>()(
  devtools(
    immer((set, get) => ({
      currentBoard: null,
      items: [],
      selectedItem: null,
      isLoading: false,
      isAdding: false,
      realtimeChannel: null,
      memberNicknameMap: {},

      loadBoard: async (boardId: string) => {
        set({ isLoading: true });
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
            await get().joinBoard(boardId);

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
          set({ isLoading: false });
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

        const tempItem: KptItem = {
          id: tempId,
          boardId,
          column,
          text,
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
          });
        }
      },

      handleRealtimeUpdate: (item: KptItem) => {
        set((state) => {
          const index = state.items.findIndex((i: KptItem) => i.id === item.id);
          if (index !== -1) {
            // RealtimeではauthorNicknameを取得できないため、既存のitemから取得する
            const authorNickname = state.items[index].authorNickname;
            const updatedItem = {
              ...item,
              authorNickname,
            };
            state.items[index] = updatedItem;

            // selectedItemも更新する
            if (state.selectedItem?.id === item.id) {
              state.selectedItem = updatedItem;
            }
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

      reset: () => {
        const { unsubscribeFromRealtime } = get();
        unsubscribeFromRealtime();
        set({
          currentBoard: null,
          items: [],
          selectedItem: null,
          isLoading: false,
          isAdding: false,
          realtimeChannel: null,
          memberNicknameMap: {},
        });
      },
    })),
    { name: 'BoardStore' }
  )
);
