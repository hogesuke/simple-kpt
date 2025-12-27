import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ReactElement, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { BoardColumn } from '@/components/ui/BoardColumn';
import { CardInput } from '@/components/ui/CardInput';
import { KPTCard } from '@/components/ui/KPTCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { useBoardActions } from '@/hooks/useBoardActions';
import { useBoardData } from '@/hooks/useBoardData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { selectActiveItem, selectItemsByColumn } from '@/lib/item-selectors';

import type { KptColumnType } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

export function KPTBoard(): ReactElement {
  const { boardId } = useParams<{ boardId: string }>();
  const { handleError } = useErrorHandler();
  const { board, items, setItems, isLoading } = useBoardData(boardId);
  const { isAdding, handleAddItem, handleDeleteItem, handleUpdateItem } = useBoardActions({
    boardId,
    setItems,
    onError: handleError,
  });
  const [newItemColumn, setNewItemColumn] = useState<KptColumnType>('keep');
  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel, collisionDetectionStrategy } = useKPTCardDnD(
    {
      columns,
      onItemsChange: setItems,
      onItemDrop: handleUpdateItem,
    }
  );
  const itemsByColumn = useMemo(() => selectItemsByColumn(items, columns), [items]);
  const activeItem = useMemo(() => selectActiveItem(items, activeId), [items, activeId]);

  const handleAddCard = async (text: string) => {
    await handleAddItem(newItemColumn, text);
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
        <header>
          <h1 className="text-2xl font-semibold">{board ? board.name : isLoading ? 'ボードを読み込み中...' : 'KPT Board'}</h1>
          <p className="text-muted-foreground mt-1 text-xs">Board ID: {boardId}</p>
        </header>

        <div className="flex flex-col items-stretch gap-x-4 gap-y-4 lg:flex-row">
          <BoardColumn title="Keep" type="keep" column="keep" items={itemsByColumn.keep} onDeleteItem={handleDeleteItem} />
          <BoardColumn title="Problem" type="problem" column="problem" items={itemsByColumn.problem} onDeleteItem={handleDeleteItem} />
          <BoardColumn title="Try" type="try" column="try" items={itemsByColumn.try} onDeleteItem={handleDeleteItem} />
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
