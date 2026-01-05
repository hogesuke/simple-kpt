export type KptColumnType = 'keep' | 'problem' | 'try';

export interface KptBoard {
  id: string;
  name: string;
  isMember?: boolean;
  ownerId?: string;
}

export interface KptItem {
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
