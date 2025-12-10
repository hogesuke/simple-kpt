import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { ReactElement, useMemo, useState } from 'react';

import { BoardColumn } from '@/components/ui/BoardColumn';
import { CardInput } from '@/components/ui/CardInput';
import { KPTCard } from '@/components/ui/KPTCard';

import type { KptColumnType, KptItem } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

// TODO: あとでダミーデータを消す
const initialItems: KptItem[] = [
  { id: '1', column: 'keep', text: 'Sample keep card' },
  { id: '2', column: 'problem', text: 'Sample problem card' },
  { id: '3', column: 'try', text: 'Sample try card' },
];

const collisionDetectionStrategy: CollisionDetection = (args) => {
  // マウスカーソルを基準にドラッグ先に判定を行う
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // 衝突判定がない場合のフォールバック
  return closestCenter(args);
};

export function KPTBoard(): ReactElement {
  const [items, setItems] = useState<KptItem[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  const itemsByColumn = useMemo(() => {
    return columns.reduce<Record<KptColumnType, KptItem[]>>(
      (result, col) => ({
        ...result,
        [col]: items.filter((item) => item.column === col),
      }),
      { keep: [], problem: [], try: [] }
    );
  }, [items]);

  const activeItem = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    setItems((prev) => {
      const dragged = prev.find((item) => item.id === activeId);
      if (!dragged) return prev;

      const isOverColumn = columns.includes(overId as KptColumnType);
      const overItem = isOverColumn ? undefined : prev.find((item) => item.id === overId);

      const targetColumn: KptColumnType | undefined = isOverColumn ? (overId as KptColumnType) : overItem?.column;

      if (!targetColumn) return prev;

      const itemsByColumn: Record<KptColumnType, KptItem[]> = {
        keep: [],
        problem: [],
        try: [],
      };

      for (const item of prev) {
        if (item.id === activeId) continue;
        itemsByColumn[item.column].push(item);
      }

      const updated: KptItem = { ...dragged, column: targetColumn };

      if (isOverColumn) {
        // カラムの余白や空のカラムにカーソルがある場合
        itemsByColumn[targetColumn].push(updated);
      } else {
        // カードの上に乗っている場合
        const targetList = itemsByColumn[targetColumn];
        const overIndexInTarget = targetList.findIndex((item) => item.id === overId);

        let insertIndex: number;

        if (dragged.column === targetColumn) {
          // 元のカラム内での active / over の位置をprevから取得する
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
          // overのカードの上に配置する
          insertIndex = overIndexInTarget === -1 ? targetList.length : overIndexInTarget;
        }

        targetList.splice(insertIndex, 0, updated);
      }

      return [...itemsByColumn.keep, ...itemsByColumn.problem, ...itemsByColumn.try];
    });
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <section className="mx-auto grid h-screen w-full max-w-[1920px] grid-rows-[1fr_auto] gap-y-4 p-8">
        <div className="flex flex-col items-stretch gap-x-4 gap-y-4 lg:flex-row">
          <BoardColumn title="Keep" type="keep" column="keep" items={itemsByColumn.keep} />
          <BoardColumn title="Problem" type="problem" column="problem" items={itemsByColumn.problem} />
          <BoardColumn title="Try" type="try" column="try" items={itemsByColumn.try} />
        </div>
        <div>
          <CardInput />
        </div>
      </section>

      {/* ドラッグ中にポインタに追従するカード */}
      <DragOverlay>{activeItem ? <KPTCard item={activeItem} /> : null}</DragOverlay>
    </DndContext>
  );
}
