import i18n from 'i18next';

import { VALID_COLUMNS, VALID_TRY_STATUSES } from '@shared/constants';

export type KptColumnType = (typeof VALID_COLUMNS)[number];

export type TryStatus = (typeof VALID_TRY_STATUSES)[number];

export const getStatusLabels = (): Record<TryStatus, string> => ({
  pending: i18n.t('board:未対応'),
  in_progress: i18n.t('board:対応中'),
  done: i18n.t('board:完了'),
  wont_fix: i18n.t('board:対応不要'),
});

// 後方互換性のため（i18n初期化後に正しい値を返す）
export const PROBLEM_STATUS_LABELS: Record<TryStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  done: '完了',
  wont_fix: '対応不要',
};

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
 * タイマープリセット
 */
export const TIMER_PRESET_SECONDS = [60, 180, 300, 600] as const;

// 翻訳されたタイマープリセットを取得する関数
export const getTimerPresets = () => [
  { label: i18n.t('board:1分'), seconds: 60 },
  { label: i18n.t('board:3分'), seconds: 180 },
  { label: i18n.t('board:5分'), seconds: 300 },
  { label: i18n.t('board:10分'), seconds: 600 },
];

// 後方互換性のため
export const TIMER_PRESETS = [
  { label: '1分', seconds: 60 },
  { label: '3分', seconds: 180 },
  { label: '5分', seconds: 300 },
  { label: '10分', seconds: 600 },
] as const;

export interface KptBoard {
  id: string;
  name: string;
  isMember?: boolean;
  ownerId?: string;
  createdAt: string;
  timer?: TimerState;
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

export const isTryItem = (item: KptItem): item is KptItem & TryItemProperties => item.column === 'try';

/**
 * ボード名を含むTryアイテム（Tryリスト表示用）
 */
export interface TryItemWithBoard extends Omit<KptItem, keyof TryItemProperties>, TryItemProperties {
  boardName: string | null;
}

export interface UserProfile {
  id: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  nickname: string | null;
}
