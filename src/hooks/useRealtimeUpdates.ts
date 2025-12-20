import { useEffect } from 'react';

import { supabase } from '@/lib/supabase-client';

import type { ItemRow } from '@/types/db';
import type { KptColumnType, KptItem } from '@/types/kpt';
import type { RealtimePostgresDeletePayload, RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

type UseRealtimeUpdatesOptions = {
  boardId: string;
  onItemsChange: (updater: (prev: KptItem[]) => KptItem[]) => void;
};

export function useRealtimeUpdates({ boardId, onItemsChange }: UseRealtimeUpdatesOptions) {
  useEffect(() => {
    if (!boardId) return;

    const mapRowToItem = (row: ItemRow): KptItem => ({
      id: row.id,
      boardId: row.board_id,
      column: row.column_name as KptColumnType,
      text: row.text,
    });

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
          onItemsChange((prev) => (prev.some((item) => item.id === newItem.id) ? prev : [...prev, newItem]));
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

          // NOTE: 自分で追加したカードについては重複して追加しないようにする
          onItemsChange((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'items',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresDeletePayload<ItemRow>) => {
          const { id } = payload.old;

          if (!id) return;

          onItemsChange((prev) => prev.filter((item) => item.id !== id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, onItemsChange]);
}
