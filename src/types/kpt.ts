export type KptColumnType = 'keep' | 'problem' | 'try';

export interface KptItem {
  id: string;
  column: KptColumnType;
  text: string;
}
