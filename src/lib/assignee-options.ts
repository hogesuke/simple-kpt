import type { BoardMember, KptItem } from '@/types/kpt';

export interface AssigneeOption {
  userId: string;
  nickname: string;
  /** 今ボードに接続しているか */
  isConnected: boolean;
}

/**
 * Tryの担当者の選択肢を作る
 *
 * 接続中の参加者に加えて、ボードに登場する人（カードの作成者・担当者・投票者）も選択肢に含める。
 * 前回の振り返りの担当者が今回は不在の場合でも、担当者が空欄にならず、不在の人にも割り当てられるようにするため。
 */
export function buildAssigneeOptions(members: BoardMember[], items: KptItem[]): AssigneeOption[] {
  const options = new Map<string, AssigneeOption>();
  for (const member of members) {
    options.set(member.userId, { userId: member.userId, nickname: member.nickname ?? '', isConnected: true });
  }

  const absentees = new Map<string, AssigneeOption>();
  const addAbsentee = (userId: string | null | undefined, nickname: string | null | undefined) => {
    if (!userId || options.has(userId) || absentees.has(userId)) return;
    absentees.set(userId, { userId, nickname: nickname?.trim() || userId, isConnected: false });
  };

  for (const item of items) {
    addAbsentee(item.assigneeId, item.assigneeNickname);
    addAbsentee(item.authorId, item.authorNickname);
    item.voters?.forEach((voter) => addAbsentee(voter.id, voter.nickname));
  }

  const sortedAbsentees = [...absentees.values()].sort((a, b) => a.nickname.localeCompare(b.nickname));
  return [...options.values(), ...sortedAbsentees];
}
