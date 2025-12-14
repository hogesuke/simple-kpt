import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ReactElement, useMemo, useState } from 'react';

import { BoardColumn } from '@/components/ui/BoardColumn';
import { CardInput } from '@/components/ui/CardInput';
import { KPTCard } from '@/components/ui/KPTCard';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { createKptItem } from '@/lib/kpt-api';

import type { KptColumnType, KptItem } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

// TODO: あとでダミーデータを消す
const initialItems: KptItem[] = [
  { id: '1', column: 'keep', text: 'Sample keep card' },
  { id: '2', column: 'problem', text: 'Sample problem card' },
  { id: '3', column: 'try', text: 'Sample try card' },
];

export function KPTBoard(): ReactElement {
  const [items, setItems] = useState<KptItem[]>(initialItems);
  const [isAdding, setIsAdding] = useState(false);
  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel, collisionDetectionStrategy } = useKPTCardDnD(
    {
      columns,
      onItemsChange: setItems,
    }
  );

  useRealtimeUpdates({
    onItemsChange: setItems,
  });

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
