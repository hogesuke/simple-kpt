export type KptColumnType = 'keep' | 'problem' | 'try';

export interface KptBoard {
  id: string;
  name: string;
}

export interface KptItem {
  id: string;
  boardId: string;
  column: KptColumnType;
  text: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}
