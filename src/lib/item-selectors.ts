import type { KptColumnType, KptItem } from '@/types/kpt';

/**
 * アイテムをカラムごとにグループ化する
 */
export function selectItemsByColumn(items: KptItem[], columns: KptColumnType[]): Record<KptColumnType, KptItem[]> {
  return columns.reduce<Record<KptColumnType, KptItem[]>>(
    (result, col) => ({
      ...result,
      [col]: items.filter((item) => item.column === col),
    }),
    { keep: [], problem: [], try: [] }
  );
}

/**
 * ドラッグ中のアイテムを取得する
 */
export function selectActiveItem(items: KptItem[], activeId: string | null): KptItem | null {
  if (!activeId) return null;
  return items.find((item) => item.id === activeId) ?? null;
}
