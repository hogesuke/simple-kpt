import { supabase } from '@/lib/supabase-client';

import type { BoardRow, ItemRow, ProfileRow } from '@/types/db';
import type { KptBoard, KptColumnType, KptItem, UserProfile } from '@/types/kpt';

function mapRowToItem(row: ItemRow & { author_nickname?: string | null }): KptItem {
  return {
    id: row.id,
    boardId: row.board_id,
    column: row.column_name as KptColumnType,
    text: row.text,
    authorId: row.author_id,
    authorNickname: row.author_nickname,
  };
}

/**
 * ボード一覧を取得する。
 */
export async function fetchBoards(): Promise<KptBoard[]> {
  const { data, error } = await supabase.functions.invoke('get-boards', {
    method: 'GET',
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  if (!data) return [];

  return (data as BoardRow[]).map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

/**
 * ボードを取得する。
 */
export async function fetchBoard(boardId: string): Promise<KptBoard | null> {
  const { data, error } = await supabase.functions.invoke(`get-board?boardId=${encodeURIComponent(boardId)}`, {
    method: 'GET',
  });

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
  const { data, error } = await supabase.functions.invoke(`get-kpt-items?boardId=${encodeURIComponent(boardId)}`, {
    method: 'GET',
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
    method: 'PATCH',
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
    method: 'DELETE',
    body: { id, boardId },
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  void data;
}

/**
 * ユーザープロフィールを取得する。
 */
export async function fetchProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase.functions.invoke('get-profile', {
    method: 'GET',
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  if (!data) return null;

  const row = data as ProfileRow;
  return {
    id: row.id,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * ユーザープロフィールを更新する。
 */
export async function updateProfile(nickname: string): Promise<UserProfile> {
  const { data, error } = await supabase.functions.invoke('update-profile', {
    method: 'PATCH',
    body: { nickname },
  });

  if (error) {
    // TODO: エラーハンドリングを改善する
    throw error;
  }

  if (!data) {
    throw new Error('Edge Function "update-profile" からデータが返されませんでした。');
  }

  const row = data as ProfileRow;
  return {
    id: row.id,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
