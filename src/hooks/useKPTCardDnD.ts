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

/**
 * 挿入位置に基づいて新しいpositionを計算する（浮動小数点方式）
 * @param targetList ドラッグ先のカラム内のアイテム一覧（ドラッグ中のアイテムを除く）
 * @param insertIndex 挿入位置
 */
export function calculateNewPosition(targetList: KptItem[], insertIndex: number): number {
  const prevItem = insertIndex > 0 ? targetList[insertIndex - 1] : null;
  const nextItem = insertIndex < targetList.length ? targetList[insertIndex] : null;

  if (!prevItem && !nextItem) {
    // 空のカラムに最初のアイテムを配置
    return 1000;
  } else if (!prevItem && nextItem) {
    // 先頭に配置
    return nextItem.position / 2;
  } else if (prevItem && !nextItem) {
    // 末尾に配置
    return prevItem.position + 1000;
  } else {
    // 2つのアイテムの間に配置
    return (prevItem!.position + nextItem!.position) / 2;
  }
}

type UseKptCardDndOptions = {
  columns: readonly KptColumnType[];
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
  const dragOverReqAniFrameRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setDragPreviewItems(items);
  };

  // NOTE: requestAnimationFrameで1フレームに1回だけ処理する。
  //       カラム境界付近でドラッグするとonDragOverのover対象が高速に振動し、setStateが繰り返されて更新深度の上限に達してしまう問題を回避するため。
  //       https://github.com/clauderic/dnd-kit/issues/1678
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overId = String(over.id);
    if (activeIdStr === overId) return;

    cancelAnimationFrame(dragOverReqAniFrameRef.current);
    dragOverReqAniFrameRef.current = requestAnimationFrame(() => {
      setDragPreviewItems((prev) => {
        const dragged = prev.find((item) => item.id === activeIdStr);
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
          if (item.id === activeIdStr) continue;
          itemsByColumn[item.column].push(item);
        }

        const targetList = itemsByColumn[targetColumn];
        let insertIndex: number;

        if (isOverColumn) {
          // カラムの何もない場所にドラッグしているときは末尾に配置する
          insertIndex = targetList.length;
        } else {
          const overIndexInTarget = targetList.findIndex((item) => item.id === overId);

          if (dragged.column === targetColumn) {
            // 同一カラム内の並び替え
            const originalColumnItems = prev.filter((item) => item.column === targetColumn);
            const activeIndexOriginal = originalColumnItems.findIndex((item) => item.id === activeIdStr);
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
        }

        // 新しいpositionを計算
        const newPosition = calculateNewPosition(targetList, insertIndex);
        // Tryカラムに移動した場合、statusが未設定ならpendingを設定
        const status = targetColumn === 'try' ? (dragged.status ?? 'pending') : dragged.status;
        const updated: KptItem = { ...dragged, column: targetColumn, position: newPosition, status };

        // 最後にドラッグした位置のカードを保持しておき、ドロップ時のサーバー更新に利用する
        lastDraggedItemRef.current = updated;

        targetList.splice(insertIndex, 0, updated);

        return [...itemsByColumn.keep, ...itemsByColumn.problem, ...itemsByColumn.try];
      });
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
    cancelAnimationFrame(dragOverReqAniFrameRef.current);
    setActiveId(null);
    setDragPreviewItems([]);
  };

  const handleDragCancel = () => {
    lastDraggedItemRef.current = null;
    cancelAnimationFrame(dragOverReqAniFrameRef.current);
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
