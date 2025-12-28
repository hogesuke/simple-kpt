import {
  closestCenter,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import { useRef, useState } from 'react';

import type { KptColumnType, KptItem } from '@/types/kpt';

type UseKptCardDndOptions = {
  columns: KptColumnType[];
  items: KptItem[];
  onItemsChange: (items: KptItem[]) => void;
  onItemDrop?: (item: KptItem) => void | Promise<void>;
};

type UseKptCardDndReturn = {
  activeId: string | null;
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  collisionDetectionStrategy: CollisionDetection;
  /**
   * 表示用のアイテム一覧。
   *
   * - ドラッグ中: プレビュー表示用のアイテム一覧
   * - ドラッグ終了後: アイテム位置更新後のアイテム一覧
   */
  displayItems: KptItem[];
};

export function useKPTCardDnD({ columns, items, onItemsChange, onItemDrop }: UseKptCardDndOptions): UseKptCardDndReturn {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragPreviewItems, setDragPreviewItems] = useState<KptItem[]>([]);
  const lastDraggedItemRef = useRef<KptItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setDragPreviewItems(items);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setDragPreviewItems((prev) => {
      const dragged = prev.find((item) => item.id === activeId);
      if (!dragged) return prev;

      const isOverColumn = columns.includes(overId as KptColumnType);
      const overItem = isOverColumn ? undefined : prev.find((item) => item.id === overId);

      const targetColumn: KptColumnType | undefined = isOverColumn ? (overId as KptColumnType) : overItem?.column;
      if (!targetColumn) return prev;

      const itemsByColumn = columns.reduce<Record<KptColumnType, KptItem[]>>(
        (result, col) => ({ ...result, [col]: [] }),
        {} as Record<KptColumnType, KptItem[]>
      );

      // ドラッグ中のカード以外を各カラムに振り分け
      for (const item of prev) {
        if (item.id === activeId) continue;
        itemsByColumn[item.column].push(item);
      }

      const updated: KptItem = { ...dragged, column: targetColumn };
      // 最後にドラッグした位置のカードを保持しておき、ドロップ時のサーバー更新に利用する
      lastDraggedItemRef.current = updated;

      if (isOverColumn) {
        // カラムの何もない場所にドラッグしているときは末尾に配置する
        itemsByColumn[targetColumn].push(updated);
      } else {
        const targetList = itemsByColumn[targetColumn];
        const overIndexInTarget = targetList.findIndex((item) => item.id === overId);

        let insertIndex: number;

        if (dragged.column === targetColumn) {
          // 同一カラム内の並び替え
          const originalColumnItems = prev.filter((item) => item.column === targetColumn);
          const activeIndexOriginal = originalColumnItems.findIndex((item) => item.id === activeId);
          const overIndexOriginal = originalColumnItems.findIndex((item) => item.id === overId);

          const movingDown = activeIndexOriginal !== -1 && overIndexOriginal !== -1 && activeIndexOriginal < overIndexOriginal;

          if (overIndexInTarget === -1) {
            insertIndex = targetList.length;
          } else {
            // 下方向にドラッグしているときは、overのカードの下に配置する
            insertIndex = movingDown ? overIndexInTarget + 1 : overIndexInTarget;
          }
        } else {
          // 別カラムから移動してきた場合はoverの位置に配置する
          insertIndex = overIndexInTarget === -1 ? targetList.length : overIndexInTarget;
        }

        targetList.splice(insertIndex, 0, updated);
      }

      return [...itemsByColumn.keep, ...itemsByColumn.problem, ...itemsByColumn.try];
    });
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    if (activeId !== null) {
      // ドラッグ中のローカルstateをグローバルstoreに反映
      onItemsChange(dragPreviewItems);

      if (lastDraggedItemRef.current && onItemDrop) {
        void onItemDrop(lastDraggedItemRef.current);
      }
    }

    lastDraggedItemRef.current = null;
    setActiveId(null);
    setDragPreviewItems([]);
  };

  const handleDragCancel = () => {
    lastDraggedItemRef.current = null;
    setActiveId(null);
    setDragPreviewItems([]);
  };

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    // マウスカーソルを基準にドラッグ先の判定を行う
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // フォールバック
    return closestCenter(args);
  };

  return {
    activeId,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    collisionDetectionStrategy,
    displayItems: activeId !== null ? dragPreviewItems : items,
  };
}
