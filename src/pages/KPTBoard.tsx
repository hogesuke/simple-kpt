import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { BoardMembersDialog } from '@/components/BoardMembersDialog';
import { BoardColumn } from '@/components/ui/BoardColumn';
import { CardInput } from '@/components/ui/CardInput';
import { ItemDetailPanel } from '@/components/ui/ItemDetailPanel';
import { KPTCard } from '@/components/ui/KPTCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { selectActiveItem, selectItemsByColumn } from '@/lib/item-selectors';
import { useBoardStore } from '@/stores/useBoardStore';

import type { KptColumnType, KptItem } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

export function KPTBoard(): ReactElement {
  const { boardId } = useParams<{ boardId: string }>();
  const { handleError } = useErrorHandler();

  const board = useBoardStore((state) => state.currentBoard);
  const items = useBoardStore((state) => state.items);
  const selectedItem = useBoardStore((state) => state.selectedItem);
  const isLoading = useBoardStore((state) => state.isLoading);
  const isAdding = useBoardStore((state) => state.isAdding);
  const loadBoard = useBoardStore((state) => state.loadBoard);
  const addItem = useBoardStore((state) => state.addItem);
  const deleteItem = useBoardStore((state) => state.deleteItem);
  const updateItem = useBoardStore((state) => state.updateItem);
  const subscribeToRealtime = useBoardStore((state) => state.subscribeToRealtime);
  const setSelectedItem = useBoardStore((state) => state.setSelectedItem);
  const reset = useBoardStore((state) => state.reset);

  const [newItemColumn, setNewItemColumn] = useState<KptColumnType>('keep');

  useEffect(() => {
    if (!boardId) return;

    const load = async () => {
      try {
        await loadBoard(boardId);
        subscribeToRealtime(boardId);
      } catch (error) {
        handleError('ボード情報の読み込みに失敗しました。');
      }
    };

    void load();

    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const handleItemsChange = useCallback((newItems: KptItem[]) => {
    useBoardStore.setState({ items: newItems });
  }, []);

  const handleItemDrop = useCallback(
    async (item: KptItem) => {
      try {
        await updateItem(item);
      } catch (error) {
        handleError('カード位置の更新に失敗しました。');
      }
    },
    [updateItem, handleError]
  );

  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel, collisionDetectionStrategy, displayItems } =
    useKPTCardDnD({
      columns,
      items,
      onItemsChange: handleItemsChange,
      onItemDrop: handleItemDrop,
    });

  const itemsByColumn = useMemo(() => selectItemsByColumn(displayItems, columns), [displayItems]);
  const activeItem = useMemo(() => selectActiveItem(displayItems, activeId), [displayItems, activeId]);

  const handleAddCard = async (text: string) => {
    if (!boardId) return;
    try {
      await addItem(boardId, newItemColumn, text);
    } catch (error) {
      handleError('カードの追加に失敗しました。');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!boardId) return;
    try {
      await deleteItem(id, boardId);
    } catch (error) {
      handleError('カードの削除に失敗しました。');
    }
  };

  const handleCardClick = useCallback(
    (item: KptItem) => {
      setSelectedItem(item);
    },
    [setSelectedItem]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedItem(null);
  }, [setSelectedItem]);

  if (!boardId) {
    return (
      <section className="mx-auto flex h-screen max-w-240 items-center justify-center px-4">
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
      <section className="mx-auto grid h-screen w-full max-w-480 grid-rows-[auto_1fr_auto] gap-y-4 p-8">
        <header>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{board ? board.name : isLoading ? 'ボードを読み込み中...' : 'KPT Board'}</h1>
              <p className="text-muted-foreground mt-1 text-xs">Board ID: {boardId}</p>
            </div>
            <BoardMembersDialog boardId={boardId} />
          </div>
        </header>

        <div className="flex flex-col items-stretch gap-x-4 gap-y-4 lg:flex-row">
          <BoardColumn title="Keep" type="keep" column="keep" items={itemsByColumn.keep} selectedItemId={selectedItem?.id} onDeleteItem={handleDeleteItem} onCardClick={handleCardClick} />
          <BoardColumn title="Problem" type="problem" column="problem" items={itemsByColumn.problem} selectedItemId={selectedItem?.id} onDeleteItem={handleDeleteItem} onCardClick={handleCardClick} />
          <BoardColumn title="Try" type="try" column="try" items={itemsByColumn.try} selectedItemId={selectedItem?.id} onDeleteItem={handleDeleteItem} onCardClick={handleCardClick} />
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

      {/* カード詳細パネル */}
      <ItemDetailPanel item={selectedItem} onClose={handleClosePanel} />
    </DndContext>
  );
}
