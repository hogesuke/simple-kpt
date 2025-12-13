import { supabase } from '@/lib/supabase-client';

import type { KptColumnType, KptItem } from '@/types/kpt';

/**
 * KPTのアイテムを作成する。
 */
export async function createKptItem(input: { column: KptColumnType; text: string }): Promise<KptItem> {
  const { data, error } = await supabase.functions.invoke('create-kpt-item', {
    body: {
      column: input.column,
      text: input.text,
    },
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  if (!data) {
    throw new Error('Edge Function からデータが返されませんでした。');
  }

  return data as KptItem;
}
