export type KptColumnType = 'keep' | 'problem' | 'try';

export interface KptBoard {
  id: string;
  name: string;
  isMember?: boolean;
}

export interface KptItem {
  id: string;
  boardId: string;
  column: KptColumnType;
  text: string;
  authorId: string | null;
  authorNickname?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}
