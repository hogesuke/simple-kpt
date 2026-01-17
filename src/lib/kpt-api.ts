import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase-client';

import type { BoardRow, ItemRow, ProfileRow } from '@/types/db';
import type { BoardMember, KptBoard, KptColumnType, KptItem, TimerState, TryItemWithBoard, TryStatus, UserProfile } from '@/types/kpt';

/**
 * ページネーション付きレスポンスの型（カーソルベース）
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * ページネーション付きレスポンスの型（オフセットベース）
 */
export interface OffsetPaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
}

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
async function convertToAPIError(error: unknown, fallbackMessage: string): Promise<APIError> {
  if (error instanceof FunctionsHttpError) {
    const status = error.context.status;
    try {
      const body = await error.context.json();
      const message = body?.error ?? fallbackMessage;
      return new APIError(message, status);
    } catch {
      // JSONパースに失敗した場合はフォールバック
      return new APIError(fallbackMessage, status);
    }
  }
  const message = error instanceof Error ? error.message : fallbackMessage;
  return new APIError(message);
}

type ItemRowWithProfiles = ItemRow & {
  author_nickname?: string | null;
  assignee_nickname?: string | null;
  vote_count?: number;
  has_voted?: boolean;
};

function mapRowToItem(row: ItemRowWithProfiles): KptItem {
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
    status: row.status as TryStatus | null,
    assigneeId: row.assignee_id,
    assigneeNickname: row.assignee_nickname,
    dueDate: row.due_date,
    voteCount: row.vote_count ?? 0,
    hasVoted: row.has_voted ?? false,
  };
}

export interface FetchBoardsOptions {
  limit?: number;
  cursor?: string;
}

/**
 * ボードリストを取得する。
 */
export async function fetchBoards(options?: FetchBoardsOptions): Promise<PaginatedResponse<KptBoard>> {
  const params = new URLSearchParams();
  if (options?.limit) {
    params.set('limit', options.limit.toString());
  }
  if (options?.cursor) {
    params.set('cursor', options.cursor);
  }

  const queryString = params.toString();
  const url = queryString ? `get-boards?${queryString}` : 'get-boards';

  const { data, error } = await supabase.functions.invoke(url, {
    method: 'GET',
  });

  if (error) {
    throw await convertToAPIError(error, 'ボードリストの取得に失敗しました');
  }

  if (!data) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  const response = data as { items: BoardRow[]; nextCursor: string | null; hasMore: boolean };
  return {
    items: response.items.map((row) => ({
      id: row.id,
      name: row.name,
      ownerId: row.owner_id ?? undefined,
      createdAt: row.created_at,
    })),
    nextCursor: response.nextCursor,
    hasMore: response.hasMore,
  };
}

interface BoardResponse extends BoardRow {
  isMember?: boolean;
  timer_started_at?: string | null;
  timer_duration_seconds?: number | null;
  timer_hide_others_cards?: boolean | null;
  timer_started_by?: string | null;
}

/**
 * ボードを取得する。
 */
export async function fetchBoard(boardId: string): Promise<KptBoard | null> {
  const { data, error } = await supabase.functions.invoke(`get-board?boardId=${encodeURIComponent(boardId)}`, {
    method: 'GET',
  });

  if (error) {
    throw await convertToAPIError(error, 'ボードの取得に失敗しました');
  }

  if (!data) return null;

  const row = data as BoardResponse;

  const timer: TimerState | undefined =
    row.timer_started_at != null
      ? {
          startedAt: row.timer_started_at,
          durationSeconds: row.timer_duration_seconds ?? null,
          hideOthersCards: row.timer_hide_others_cards ?? false,
          startedBy: row.timer_started_by ?? null,
        }
      : undefined;

  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
    isMember: row.isMember,
    createdAt: row.created_at,
    timer,
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
    throw await convertToAPIError(error, 'ボードの作成に失敗しました');
  }

  if (!data) {
    throw new APIError('ボードの作成に失敗しました');
  }

  const row = data as BoardRow;
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * ボードのKPTアイテム一覧を取得する。
 */
export async function fetchKptItems(boardId: string): Promise<KptItem[]> {
  const { data, error } = await supabase.functions.invoke(`get-kpt-items?boardId=${encodeURIComponent(boardId)}`, {
    method: 'GET',
  });

  if (error) {
    throw await convertToAPIError(error, 'アイテム一覧の取得に失敗しました');
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
    throw await convertToAPIError(error, 'アイテムの作成に失敗しました');
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
  column?: KptColumnType;
  text?: string;
  position?: number;
  status?: TryStatus | null;
  assigneeId?: string | null;
  dueDate?: string | null;
}): Promise<KptItem> {
  const { data, error } = await supabase.functions.invoke('update-kpt-item', {
    method: 'PATCH',
    body: {
      id: input.id,
      boardId: input.boardId,
      column: input.column,
      text: input.text,
      position: input.position,
      status: input.status,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
    },
  });

  if (error) {
    throw await convertToAPIError(error, 'アイテムの更新に失敗しました');
  }

  if (!data) {
    throw new APIError('アイテムの更新に失敗しました');
  }

  return mapRowToItem(data as ItemRowWithProfiles);
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
    throw await convertToAPIError(error, 'アイテムの削除に失敗しました');
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
    throw await convertToAPIError(error, 'プロフィールの取得に失敗しました');
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
    throw await convertToAPIError(error, 'プロフィールの更新に失敗しました');
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
    throw await convertToAPIError(error, 'メンバー一覧の取得に失敗しました');
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
    throw await convertToAPIError(error, 'ボードへの参加に失敗しました');
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
    throw await convertToAPIError(error, 'ボードの削除に失敗しました');
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
    throw await convertToAPIError(error, 'ボード名の更新に失敗しました');
  }

  if (!data) {
    throw new APIError('ボード名の更新に失敗しました');
  }

  const row = data as BoardRow;
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
    createdAt: row.created_at,
  };
}

export interface FetchTryItemsOptions {
  status?: TryStatus[];
  assigneeId?: string;
  limit?: number;
  offset?: number;
}

type TryItemRow = ItemRow & {
  author_nickname?: string | null;
  assignee_nickname?: string | null;
  board_name?: string | null;
};

/**
 * 全ボードのTryアイテム一覧を取得する。
 */
export async function fetchTryItems(options?: FetchTryItemsOptions): Promise<OffsetPaginatedResponse<TryItemWithBoard>> {
  const params = new URLSearchParams();
  if (options?.status && options.status.length > 0) {
    params.set('status', options.status.join(','));
  }
  if (options?.assigneeId) {
    params.set('assigneeId', options.assigneeId);
  }
  if (options?.limit) {
    params.set('limit', options.limit.toString());
  }
  if (options?.offset) {
    params.set('offset', options.offset.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `get-try-items?${queryString}` : 'get-try-items';

  const { data, error } = await supabase.functions.invoke(url, {
    method: 'GET',
  });

  if (error) {
    throw await convertToAPIError(error, 'Tryアイテム一覧の取得に失敗しました');
  }

  if (!data) {
    return { items: [], hasMore: false };
  }

  const response = data as { items: TryItemRow[]; hasMore: boolean };
  return {
    items: response.items.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      boardName: row.board_name ?? null,
      column: row.column_name as KptColumnType,
      text: row.text,
      position: row.position,
      authorId: row.author_id,
      authorNickname: row.author_nickname,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: (row.status as TryStatus) ?? null,
      assigneeId: row.assignee_id,
      assigneeNickname: row.assignee_nickname ?? null,
      dueDate: row.due_date,
    })),
    hasMore: response.hasMore,
  };
}

export interface StartTimerInput {
  boardId: string;
  durationSeconds: number;
  hideOthersCards: boolean;
}

export interface StartTimerResponse {
  success: boolean;
  timerStartedAt: string;
  durationSeconds: number;
  hideOthersCards: boolean;
  startedBy: string;
}

/**
 * タイマーを開始する。
 */
export async function startTimer(input: StartTimerInput): Promise<StartTimerResponse> {
  const { data, error } = await supabase.functions.invoke('start-timer', {
    method: 'POST',
    body: input,
  });

  if (error) {
    throw await convertToAPIError(error, 'タイマーの開始に失敗しました');
  }

  if (!data) {
    throw new APIError('タイマーの開始に失敗しました');
  }

  return data as StartTimerResponse;
}

/**
 * タイマーを停止する。
 */
export async function stopTimer(boardId: string): Promise<{ success: boolean }> {
  const { data, error } = await supabase.functions.invoke('stop-timer', {
    method: 'POST',
    body: { boardId },
  });

  if (error) {
    throw await convertToAPIError(error, 'タイマーの停止に失敗しました');
  }

  if (!data) {
    throw new APIError('タイマーの停止に失敗しました');
  }

  return data as { success: boolean };
}

export interface OwnedBoard {
  id: string;
  name: string;
  members: Array<{ userId: string; nickname: string | null }>;
  hasOtherMembers: boolean;
}

/**
 * 所有ボード一覧を取得する。
 */
export async function fetchOwnedBoards(): Promise<OwnedBoard[]> {
  const { data, error } = await supabase.functions.invoke('get-owned-boards', {
    method: 'GET',
  });

  if (error) {
    throw await convertToAPIError(error, '所有ボードの取得に失敗しました');
  }

  if (!data) {
    return [];
  }

  return (data as { boards: OwnedBoard[] }).boards;
}

/**
 * アカウントを削除する。
 */
export async function deleteAccount(transfers: Array<{ boardId: string; newOwnerId: string }>): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'DELETE',
    body: { transfers },
  });

  if (error) {
    throw await convertToAPIError(error, 'アカウントの削除に失敗しました');
  }
}

export interface ToggleVoteResponse {
  itemId: string;
  voteCount: number;
  hasVoted: boolean;
}

/**
 * アイテムの投票をトグルする。
 */
export async function toggleVote(itemId: string): Promise<ToggleVoteResponse> {
  const { data, error } = await supabase.functions.invoke('toggle-vote', {
    method: 'POST',
    body: { itemId },
  });

  if (error) {
    throw await convertToAPIError(error, '投票に失敗しました');
  }

  if (!data) {
    throw new APIError('投票に失敗しました');
  }

  return data as ToggleVoteResponse;
}

// NOTE: ここに手を入れる場合、supabase/functions/get-stats/index.tsのPeriod型と同期すること
export type StatsPeriod = '1m' | '3m' | '6m' | '12m';

export interface WeeklyKeepData {
  week: string;
  cumulativeCount: number;
}

export interface WeeklyProblemData {
  week: string;
  cumulativeCount: number;
}

export interface WeeklyTryData {
  week: string;
  cumulativeCount: number;
  cumulativeCompletedCount: number;
}

export interface StatsResponse {
  hasData: boolean;
  keepStats: {
    totalCount: number;
    weeklyData: WeeklyKeepData[];
  };
  problemStats: {
    totalCount: number;
    weeklyData: WeeklyProblemData[];
  };
  tryStats: {
    completedCount: number;
    totalCount: number;
    achievementRate: number;
    weeklyData: WeeklyTryData[];
  };
}

/**
 * 統計データを取得する。
 */
export async function fetchStats(period: StatsPeriod = '3m'): Promise<StatsResponse> {
  const { data, error } = await supabase.functions.invoke(`get-stats?period=${period}`, {
    method: 'GET',
  });

  if (error) {
    throw await convertToAPIError(error, '統計データの取得に失敗しました');
  }

  if (!data) {
    return {
      hasData: false,
      keepStats: { totalCount: 0, weeklyData: [] },
      problemStats: { totalCount: 0, weeklyData: [] },
      tryStats: { completedCount: 0, totalCount: 0, achievementRate: 0, weeklyData: [] },
    };
  }

  return data as StatsResponse;
}
