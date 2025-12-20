import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { BoardColumn } from '@/components/ui/BoardColumn';
import { CardInput } from '@/components/ui/CardInput';
import { KPTCard } from '@/components/ui/KPTCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { createKptItem, fetchBoard, fetchKptItemsByBoard } from '@/lib/kpt-api';

import type { KptBoard, KptColumnType, KptItem } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

export function KPTBoard(): ReactElement {
  const { boardId } = useParams<{ boardId: string }>();

  const [board, setBoard] = useState<KptBoard | null>(null);
  const [items, setItems] = useState<KptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemColumn, setNewItemColumn] = useState<KptColumnType>('keep');

  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel, collisionDetectionStrategy } = useKPTCardDnD(
    {
      columns,
      onItemsChange: setItems,
    }
  );

  useEffect(() => {
    if (!boardId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const [boardData, itemData] = await Promise.all([fetchBoard(boardId), fetchKptItemsByBoard(boardId)]);
        setBoard(boardData);
        setItems(itemData);
      } catch (error) {
        // TODO: エラーハンドリングを改善する
        window.alert('ボード情報の読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [boardId]);

  useRealtimeUpdates({
    boardId: boardId ?? '',
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
    if (!boardId) {
      window.alert('ボードが見つかりません。');
      return;
    }

    try {
      setIsAdding(true);
      const newItem = await createKptItem({ boardId, column: newItemColumn, text });
      setItems((prev) => [...prev, newItem]);
    } catch (error) {
      // TODO: エラーハンドリングを改善する
      window.alert('カードの追加に失敗しました。');
    } finally {
      setIsAdding(false);
    }
  };

  if (!boardId) {
    return (
      <section className="mx-auto flex h-screen max-w-[960px] items-center justify-center px-4">
        <p className="text-destructive text-sm">ボードIDが指定されていません。</p>
      </section>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <section className="mx-auto grid h-screen w-full max-w-[1920px] grid-rows-[auto_1fr_auto] gap-y-4 p-8">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{board ? board.name : isLoading ? 'ボードを読み込み中...' : 'KPT Board'}</h1>
            <p className="text-muted-foreground mt-1 text-xs">Board ID: {boardId}</p>
          </div>
        </header>

        <div className="flex flex-col items-stretch gap-x-4 gap-y-4 lg:flex-row">
          <BoardColumn title="Keep" type="keep" column="keep" items={itemsByColumn.keep} />
          <BoardColumn title="Problem" type="problem" column="problem" items={itemsByColumn.problem} />
          <BoardColumn title="Try" type="try" column="try" items={itemsByColumn.try} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={newItemColumn} onValueChange={(value) => setNewItemColumn(value as KptColumnType)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="カラムを選択" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <CardInput onSubmitText={handleAddCard} disabled={isAdding || isLoading} placeholder="Your input here" />
        </div>
      </section>

      {/* ドラッグ中にポインタに追従するカード */}
      <DragOverlay>{activeItem ? <KPTCard item={activeItem} /> : null}</DragOverlay>
    </DndContext>
  );
}
