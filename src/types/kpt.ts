export type KptColumnType = 'keep' | 'problem' | 'try';

export type TryStatus = 'pending' | 'in_progress' | 'done' | 'wont_fix';

export const PROBLEM_STATUS_LABELS: Record<TryStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  done: '完了',
  wont_fix: '対応不要',
};

export interface KptBoard {
  id: string;
  name: string;
  isMember?: boolean;
  ownerId?: string;
  createdAt: string;
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
