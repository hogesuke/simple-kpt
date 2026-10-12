import { VALID_COLUMNS, VALID_TRY_STATUSES } from '@shared/constants';

export type KptColumnType = (typeof VALID_COLUMNS)[number];

export type TryStatus = (typeof VALID_TRY_STATUSES)[number];

/**
 * タイマーステータス
 */
export interface TimerState {
  startedAt: string | null;
  durationSeconds: number | null;
  hideOthersCards: boolean;
  startedBy: string | null;
}

/**
 * Try専用のプロパティ
 */
export interface TryItemProperties {
  status: TryStatus | null;
  assigneeId: string | null;
  assigneeNickname: string | null;
  dueDate: string | null;
}

/**
 * 投票者情報
 */
export interface Voter {
  id: string;
  nickname: string | null;
}

/**
 * KPTアイテムの共通プロパティ
 */
export interface KptItem extends Partial<TryItemProperties> {
  id: string;
  boardId: string;
  column: KptColumnType;
  text: string;
  position: number;
  authorId: string | null;
  authorNickname?: string | null;
  createdAt?: string;
  updatedAt?: string;
  voteCount?: number;
  hasVoted?: boolean;
  voters?: Voter[];
}

export interface BoardMember {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  nickname: string | null;
}
