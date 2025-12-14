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
  type DragEndEvent,
} from '@dnd-kit/core';
import { RealtimePostgresDeletePayload, RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import { ReactElement, useEffect, useMemo, useState } from 'react';

import { BoardColumn } from '@/components/ui/BoardColumn';
import { CardInput } from '@/components/ui/CardInput';
import { KPTCard } from '@/components/ui/KPTCard';
import { createKptItem } from '@/lib/kpt-api';
import { supabase } from '@/lib/supabase-client';

import type { ItemRow } from '@/types/db';
import type { KptColumnType, KptItem } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

// TODO: あとでダミーデータを消す
const initialItems: KptItem[] = [
  { id: '1', column: 'keep', text: 'Sample keep card' },
  { id: '2', column: 'problem', text: 'Sample problem card' },
  { id: '3', column: 'try', text: 'Sample try card' },
];

const collisionDetectionStrategy: CollisionDetection = (args) => {
  // マウスカーソルを基準にドラッグ先の判定を行う
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // フォールバック
  return closestCenter(args);
};

export function KPTBoard(): ReactElement {
  const [items, setItems] = useState<KptItem[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  const itemsByColumn = useMemo(
    () =>
      columns.reduce<Record<KptColumnType, KptItem[]>>(
        (result, col) => ({
          ...result,
          [col]: items.filter((item) => item.column === col),
        }),
        { keep: [], problem: [], try: [] }
      ),
    [items]
  );

  const activeItem = useMemo(() => items.find((item) => item.id === activeId) ?? null, [items, activeId]);

  useEffect(() => {
    const mapRowToItem = (row: ItemRow): KptItem => ({
      id: row.id,
      column: row.column_name as KptColumnType,
      text: row.text,
    });

    const channel = supabase
      .channel('kpt-items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, (payload: RealtimePostgresInsertPayload<ItemRow>) => {
        const newItem = mapRowToItem(payload.new);

        // NOTE: 自分で追加したカードについては重複して追加しないようにする
        setItems((prev) => (prev.some((item) => item.id === newItem.id) ? prev : [...prev, newItem]));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, (payload: RealtimePostgresUpdatePayload<ItemRow>) => {
        const updatedItem = mapRowToItem(payload.new);
        setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (payload: RealtimePostgresDeletePayload<ItemRow>) => {
        const { id } = payload.old;

        if (!id) {
          return;
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

      // ドラッグ中のカード以外を各カラムに振り分け
      for (const item of prev) {
        if (item.id === activeId) continue;
        itemsByColumn[item.column].push(item);
      }

      const updated: KptItem = { ...dragged, column: targetColumn };

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
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleAddCard = async (text: string) => {
    try {
      setIsAdding(true);
      const newItem = await createKptItem({ column: 'keep', text });
      setItems((prev) => [...prev, newItem]);
    } catch (error) {
      // TODO: エラーハンドリングを改善する
      window.alert('カードの追加に失敗しました。');
    } finally {
      setIsAdding(false);
    }
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
          <CardInput onSubmitText={handleAddCard} disabled={isAdding} placeholder="Your input here" />
        </div>
      </section>

      {/* ドラッグ中にポインタに追従するカード */}
      <DragOverlay>{activeItem ? <KPTCard item={activeItem} /> : null}</DragOverlay>
    </DndContext>
  );
}
