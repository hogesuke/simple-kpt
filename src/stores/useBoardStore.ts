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
  isLoading: boolean;
  isAdding: boolean;
  realtimeChannel: RealtimeChannel | null;

  loadBoard: (boardId: string) => Promise<void>;
  addItem: (boardId: string, column: KptColumnType, text: string) => Promise<void>;
  updateItem: (item: KptItem) => Promise<void>;
  deleteItem: (id: string, boardId: string) => Promise<void>;
  subscribeToRealtime: (boardId: string) => void;
  unsubscribeFromRealtime: () => void;
  handleRealtimeInsert: (item: KptItem) => void;
  handleRealtimeUpdate: (item: KptItem) => void;
  handleRealtimeDelete: (id: string) => void;
  reset: () => void;
}

const mapRowToItem = (row: ItemRow): KptItem => ({
  id: row.id,
  boardId: row.board_id,
  column: row.column_name as KptColumnType,
  text: row.text,
  authorId: row.author_id,
  authorNickname: null, // Realtime では nickname は取得できないため null
});

export const useBoardStore = create<BoardState>()(
  devtools(
    immer((set, get) => ({
      currentBoard: null,
      items: [],
      isLoading: false,
      isAdding: false,
      realtimeChannel: null,

      loadBoard: async (boardId: string) => {
        set({ isLoading: true });
        try {
          const [board, items] = await Promise.all([api.fetchBoard(boardId), api.fetchKptItems(boardId)]);
          set({ currentBoard: board, items, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
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

        set((state) => {
          const index = state.items.findIndex((i: KptItem) => i.id === item.id);
          if (index !== -1) {
            state.items[index] = item;
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
          set({ items: oldItems });
          throw error;
        }
      },

      deleteItem: async (id: string, boardId: string) => {
        const oldItems = get().items;

        set((state) => {
          state.items = state.items.filter((item: KptItem) => item.id !== id);
        });

        try {
          await api.deleteKptItem(id, boardId);
        } catch (error) {
          // エラー時はロールバックする
          set({ items: oldItems });
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
          .channel(`kpt-items-${boardId}`)
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
              get().handleRealtimeInsert(newItem);
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
              const { id } = payload.old;
              if (id) {
                get().handleRealtimeDelete(id);
              }
            }
          )
          .subscribe();

        set({ realtimeChannel: channel });
      },

      unsubscribeFromRealtime: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          set({ realtimeChannel: null });
        }
      },

      handleRealtimeInsert: (item: KptItem) => {
        set((state) => {
          // 重複チェック
          if (!state.items.some((i: KptItem) => i.id === item.id)) {
            state.items.push(item);
          }
        });
      },

      handleRealtimeUpdate: (item: KptItem) => {
        set((state) => {
          const index = state.items.findIndex((i: KptItem) => i.id === item.id);
          if (index !== -1) {
            // RealtimeではauthorNicknameを取得できないため、既存のitemから取得する
            const authorNickname = state.items[index].authorNickname;
            state.items[index] = {
              ...item,
              authorNickname,
            };
          }
        });
      },

      handleRealtimeDelete: (id: string) => {
        set((state) => {
          state.items = state.items.filter((item: KptItem) => item.id !== id);
        });
      },

      reset: () => {
        const { unsubscribeFromRealtime } = get();
        unsubscribeFromRealtime();
        set({
          currentBoard: null,
          items: [],
          isLoading: false,
          isAdding: false,
          realtimeChannel: null,
        });
      },
    })),
    { name: 'BoardStore' }
  )
);
