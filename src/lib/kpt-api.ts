import { supabase } from '@/lib/supabase-client';

import type { BoardRow, ItemRow } from '@/types/db';
import type { KptBoard, KptColumnType, KptItem } from '@/types/kpt';

function mapRowToItem(row: ItemRow): KptItem {
  return {
    id: row.id,
    boardId: row.board_id,
    column: row.column_name as KptColumnType,
    text: row.text,
  };
}

/**
 * ボードを取得する。
 */
export async function fetchBoard(boardId: string): Promise<KptBoard | null> {
  const { data, error } = await supabase.from('boards').select('id, name').eq('id', boardId).maybeSingle();

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  if (!data) return null;

  const row = data as BoardRow;
  return {
    id: row.id,
    name: row.name,
  };
}

/**
 * 新しいボードを作成する。
 */
export async function createBoard(name: string): Promise<KptBoard> {
  const { data, error } = await supabase.functions.invoke('create-board', {
    body: { name },
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  if (!data) {
    throw new Error('Edge Function "create-board" からデータが返されませんでした。');
  }

  return data as KptBoard;
}

/**
 * ボードのKPTアイテム一覧を取得する。
 */
export async function fetchKptItems(boardId: string): Promise<KptItem[]> {
  const { data, error } = await supabase.functions.invoke('get-kpt-items', {
    body: { boardId },
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  if (!data) return [];

  return (data as ItemRow[]).map(mapRowToItem);
}

/**
 * KPTのアイテムを作成する。
 */
export async function createKptItem(input: { boardId: string; column: KptColumnType; text: string }): Promise<KptItem> {
  const { data, error } = await supabase.functions.invoke('create-kpt-item', {
    body: {
      boardId: input.boardId,
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

/**
 * KPTのアイテムを更新する。
 */
export async function updateKptItem(input: { id: string; boardId: string; column: KptColumnType; text: string }): Promise<KptItem> {
  const { data, error } = await supabase.functions.invoke('update-kpt-item', {
    body: {
      id: input.id,
      boardId: input.boardId,
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

  return mapRowToItem(data as ItemRow);
}

/**
 * KPTのアイテムを削除する。
 */
export async function deleteKptItem(id: string, boardId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-kpt-item', {
    body: { id, boardId },
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  void data;
}
