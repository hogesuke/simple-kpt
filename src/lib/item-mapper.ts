import type { ItemRow } from '@/types/db';
import type { KptColumnType, KptItem, TryStatus, Voter } from '@/types/kpt';

/**
 * プロフィール情報を含む拡張ItemRow型
 */
export type ItemRowWithProfiles = ItemRow & {
  author_nickname?: string | null;
  assignee_nickname?: string | null;
  vote_count?: number;
  has_voted?: boolean;
  voters?: Voter[];
};

/**
 * DBの行データをKptItemに変換する
 *
 * @param row - DBから取得した行データ
 * @returns KptItem形式のオブジェクト
 *
 * 注: Realtimeイベントではnicknameが取得できないため、
 *     author_nickname/assignee_nicknameはundefinedの場合nullになる
 */
export function mapRowToItem(row: ItemRowWithProfiles): KptItem {
  return {
    id: row.id,
    boardId: row.board_id,
    column: row.column_name as KptColumnType,
    text: row.text,
    position: row.position,
    authorId: row.author_id,
    authorNickname: row.author_nickname ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status as TryStatus | null,
    assigneeId: row.assignee_id,
    assigneeNickname: row.assignee_nickname ?? null,
    dueDate: row.due_date,
    voteCount: row.vote_count ?? 0,
    hasVoted: row.has_voted ?? false,
    voters: row.voters ?? [],
  };
}
