import { RealtimePostgresDeletePayload, RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase-client';
import { KptColumnType, KptItem } from '@/types/kpt';

import type { ItemRow } from '@/types/db';

type UseRealtimeUpdatesOptions = {
  onItemsChange: (updater: (prev: KptItem[]) => KptItem[]) => void;
};

export function useRealtimeUpdates({ onItemsChange }: UseRealtimeUpdatesOptions) {
  useEffect(() => {
    const mapRowToItem = (row: ItemRow): KptItem => ({
      id: row.id,
      column: row.column_name as KptColumnType,
      text: row.text,
    });

    const channel = supabase
      .channel('kpt-items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, (payload: RealtimePostgresInsertPayload<ItemRow>) => {
        const newItem = mapRowToItem(payload.new);

        // NOTE: 自分で追加したカードについては重複して追加しないようにする
        onItemsChange((prev) => (prev.some((item) => item.id === newItem.id) ? prev : [...prev, newItem]));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, (payload: RealtimePostgresUpdatePayload<ItemRow>) => {
        const updatedItem = mapRowToItem(payload.new);
        onItemsChange((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (payload: RealtimePostgresDeletePayload<ItemRow>) => {
        const { id } = payload.old;

        if (!id) {
          return;
        }

        onItemsChange((prev) => prev.filter((item) => item.id !== id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onItemsChange]);
}
