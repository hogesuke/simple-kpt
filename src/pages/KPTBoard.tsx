import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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

  const itemsByColumn = useMemo(
    () =>
      columns.reduce<Record<KptColumnType, KptItem[]>>((acc, col) => ({ ...acc, [col]: items.filter((i) => i.column === col) }), {
        keep: [],
        problem: [],
        try: [],
      }),
    [items]
  );

  const activeItem = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setItems((prev) => {
      const activeItem = prev.find((item) => item.id === activeId);
      if (!activeItem) return prev;

      // --- カラムの上にドロップした場合 ---
      if (columns.includes(overId as KptColumnType)) {
        const targetColumn = overId as KptColumnType;

        // ドロップ先が同一カラムならそのまま
        if (targetColumn === activeItem.column) return prev;

        return prev.map((item) => (item.id === activeId ? { ...item, column: targetColumn } : item));
      }

      // --- カード上にドロップした場合 ---
      const overItem = prev.find((item) => item.id === overId);
      if (!overItem) return prev;

      const activeColumn = activeItem.column;
      const overColumn = overItem.column;

      if (activeColumn === overColumn) {
        const columnItems = prev.filter((item) => item.column === activeColumn);
        const otherItems = prev.filter((item) => item.column !== activeColumn);

        const oldIndex = columnItems.findIndex((item) => item.id === activeId);
        const newIndex = columnItems.findIndex((item) => item.id === overId);
        const reordered = arrayMove(columnItems, oldIndex, newIndex);
        return [...otherItems, ...reordered];
      }

      return prev.map((item) => (item.id === activeId ? { ...item, column: overColumn } : item));
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
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
