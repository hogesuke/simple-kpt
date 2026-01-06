import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase-client';

import type { BoardRow, ItemRow, ProfileRow } from '@/types/db';
import type { BoardMember, KptBoard, KptColumnType, KptItem, UserProfile } from '@/types/kpt';

/**
 * APIエラークラス
 *
 * Supabaseの`FunctionsHttpError`から詰め替えて変換する。
 * 呼び出し側のSupabaseへの依存を減らし、将来的にバックエンドを変更するような場合に備える。
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * エラーをAPIErrorに変換する。
 */
function convertToAPIError(error: unknown, fallbackMessage: string): APIError {
  const status = error instanceof FunctionsHttpError ? error.context.status : undefined;
  const message = error instanceof Error ? error.message : fallbackMessage;
  return new APIError(message, status);
}

function mapRowToItem(row: ItemRow & { author_nickname?: string | null }): KptItem {
  return {
    id: row.id,
    boardId: row.board_id,
    column: row.column_name as KptColumnType,
    text: row.text,
    position: row.position,
    authorId: row.author_id,
    authorNickname: row.author_nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    throw convertToAPIError(error, 'ボード一覧の取得に失敗しました');
  }

  if (!data) return [];

  return (data as BoardRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
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
    throw convertToAPIError(error, 'ボードの取得に失敗しました');
  }

  if (!data) return null;

  const row = data as BoardRow & { isMember?: boolean };
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
    isMember: row.isMember,
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
    throw convertToAPIError(error, 'ボードの作成に失敗しました');
  }

  if (!data) {
    throw new APIError('ボードの作成に失敗しました');
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
    throw convertToAPIError(error, 'アイテム一覧の取得に失敗しました');
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
    throw convertToAPIError(error, 'アイテムの作成に失敗しました');
  }

  if (!data) {
    throw new APIError('アイテムの作成に失敗しました');
  }

  return data as KptItem;
}

/**
 * KPTのアイテムを更新する。
 */
export async function updateKptItem(input: {
  id: string;
  boardId: string;
  column: KptColumnType;
  text: string;
  position?: number;
}): Promise<KptItem> {
  const { data, error } = await supabase.functions.invoke('update-kpt-item', {
    method: 'PATCH',
    body: {
      id: input.id,
      boardId: input.boardId,
      column: input.column,
      text: input.text,
      position: input.position,
    },
  });

  if (error) {
    throw convertToAPIError(error, 'アイテムの更新に失敗しました');
  }

  if (!data) {
    throw new APIError('アイテムの更新に失敗しました');
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
    throw convertToAPIError(error, 'アイテムの削除に失敗しました');
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
    throw convertToAPIError(error, 'プロフィールの取得に失敗しました');
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
    throw convertToAPIError(error, 'プロフィールの更新に失敗しました');
  }

  if (!data) {
    throw new APIError('プロフィールの更新に失敗しました');
  }

  const row = data as ProfileRow;
  return {
    id: row.id,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * ボードのメンバー一覧を取得する。
 */
export async function fetchBoardMembers(boardId: string): Promise<BoardMember[]> {
  const { data, error } = await supabase.functions.invoke(`get-board-members?boardId=${encodeURIComponent(boardId)}`, {
    method: 'GET',
  });

  if (error) {
    throw convertToAPIError(error, 'メンバー一覧の取得に失敗しました');
  }

  if (!data) return [];

  return data as BoardMember[];
}

/**
 * ボードに参加する。
 */
export async function joinBoard(boardId: string): Promise<{ success: boolean; alreadyMember: boolean }> {
  const { data, error } = await supabase.functions.invoke('join-board', {
    method: 'POST',
    body: { boardId },
  });

  if (error) {
    throw convertToAPIError(error, 'ボードへの参加に失敗しました');
  }

  if (!data) {
    throw new APIError('ボードへの参加に失敗しました');
  }

  return data as { success: boolean; alreadyMember: boolean };
}

/**
 * ボードを削除する。
 */
export async function deleteBoard(boardId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-board', {
    method: 'DELETE',
    body: { boardId },
  });

  if (error) {
    throw convertToAPIError(error, 'ボードの削除に失敗しました');
  }

  void data;
}

/**
 * ボード名を更新する。
 */
export async function updateBoard(boardId: string, name: string): Promise<KptBoard> {
  const { data, error } = await supabase.functions.invoke('update-board', {
    method: 'PATCH',
    body: { boardId, name },
  });

  if (error) {
    throw convertToAPIError(error, 'ボード名の更新に失敗しました');
  }

  if (!data) {
    throw new APIError('ボード名の更新に失敗しました');
  }

  const row = data as BoardRow;
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
  };
}
