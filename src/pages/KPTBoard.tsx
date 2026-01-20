import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { ErrorAlert, ErrorAlertAction } from '@/components/ErrorAlert';
import { FilterBar } from '@/components/FilterBar';
import { ItemAddForm } from '@/components/ItemAddForm';
import { ItemDetailPanel } from '@/components/ItemDetailPanel';
import { KPTBoardActions } from '@/components/KPTBoardActions';
import { KPTBoardColumns } from '@/components/KPTBoardColumns';
import { KPTBoardHeader } from '@/components/KPTBoardHeader';
import { KPTCard } from '@/components/KPTCard';
import { Button } from '@/components/shadcn/button';
import { BoardProvider } from '@/contexts/BoardProvider';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useItemActions } from '@/hooks/useItemActions';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { selectActiveItem, selectItemsByColumn } from '@/lib/item-selectors';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBoardStore } from '@/stores/useBoardStore';

import type { KptColumnType, KptItem } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

export function KPTBoard(): ReactElement {
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleError } = useErrorHandler();
  const user = useAuthStore((state) => state.user);

  const board = useBoardStore((state) => state.currentBoard);
  const items = useBoardStore((state) => state.items);
  const selectedItem = useBoardStore((state) => state.selectedItem);
  const isLoading = useBoardStore((state) => state.isLoading);
  const isAdding = useBoardStore((state) => state.isAdding);
  const loadError = useBoardStore((state) => state.loadError);
  const joinError = useBoardStore((state) => state.joinError);
  const isNotFound = useBoardStore((state) => state.isNotFound);
  const filter = useBoardStore((state) => state.filter);
  const loadBoard = useBoardStore((state) => state.loadBoard);
  const addItem = useBoardStore((state) => state.addItem);
  const subscribeToItemEvents = useBoardStore((state) => state.subscribeToItemEvents);
  const setSelectedItem = useBoardStore((state) => state.setSelectedItem);
  const setFilterTag = useBoardStore((state) => state.setFilterTag);
  const setFilterMemberId = useBoardStore((state) => state.setFilterMemberId);
  const memberNicknameMap = useBoardStore((state) => state.memberNicknameMap);
  const timerState = useBoardStore((state) => state.timerState);
  const subscribeToTimerEvents = useBoardStore((state) => state.subscribeToTimerEvents);
  const reset = useBoardStore((state) => state.reset);

  const { handleItemDrop } = useItemActions(boardId);

  const handleCardClick = useCallback(
    (item: KptItem) => {
      setSelectedItem(item);
      searchParams.set('itemId', item.id);
      setSearchParams(searchParams, { replace: true });
    },
    [setSelectedItem, searchParams, setSearchParams]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedItem(null);
    searchParams.delete('itemId');
    setSearchParams(searchParams, { replace: true });
  }, [setSelectedItem, searchParams, setSearchParams]);

  const [newItemColumn, setNewItemColumn] = useState<KptColumnType>('keep');
  const [localHideOthersCards, setLocalHideOthersCards] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    const load = async (id: string) => {
      try {
        await loadBoard(id);
        subscribeToItemEvents(id);
        subscribeToTimerEvents(id);
      } catch {
        // loadErrorはuseBoardStore内で設定されるため、ここでは何もしない
      }
    };

    void load(boardId);

    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useEffect(() => {
    if (isNotFound) {
      navigate('/not-found', { replace: true });
    }
  }, [isNotFound, navigate]);

  useEffect(() => {
    if (joinError) {
      toast.error(joinError);
      navigate('/boards', { replace: true });
    }
  }, [joinError, navigate]);

  // タイマー開始時にデフォルトの表示設定を適用
  useEffect(() => {
    if (timerState?.startedAt) {
      setLocalHideOthersCards(timerState.hideOthersCards);
    } else {
      setLocalHideOthersCards(false);
    }
  }, [timerState?.startedAt, timerState?.hideOthersCards]);

  // クエリパラメータのitemIdに該当するアイテムのDetailPanelを開く
  useEffect(() => {
    const itemId = searchParams.get('itemId');
    if (!itemId || isLoading || items.length === 0) return;

    // すでに選択済みの場合はスキップ
    if (selectedItem?.id === itemId) return;

    const targetItem = items.find((item) => item.id === itemId);
    if (targetItem) {
      setSelectedItem(targetItem);
    }
  }, [searchParams, isLoading, items, selectedItem, setSelectedItem]);

  const handleItemsChange = useCallback((newItems: KptItem[]) => {
    useBoardStore.setState({ items: newItems });
  }, []);

  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel, collisionDetectionStrategy, displayItems } =
    useKPTCardDnD({
      columns,
      items,
      onItemsChange: handleItemsChange,
      onItemDrop: handleItemDrop,
    });

  const filteredItems = useMemo(() => {
    let result = displayItems;

    // タイマー中でカード非表示モードの場合、自分のカードのみ表示
    if (timerState?.startedAt && localHideOthersCards) {
      result = result.filter((item) => item.authorId === user?.id);
    }

    if (filter.tag) {
      result = result.filter((item) => item.text.includes(filter.tag!));
    }

    if (filter.memberId) {
      result = result.filter((item) => item.authorId === filter.memberId);
    }

    return result;
  }, [displayItems, filter.tag, filter.memberId, timerState?.startedAt, localHideOthersCards, user?.id]);

  const itemsByColumn = useMemo(() => selectItemsByColumn(filteredItems, columns), [filteredItems]);
  const activeItem = useMemo(() => selectActiveItem(displayItems, activeId), [displayItems, activeId]);

  const handleAddCard = async (text: string) => {
    if (!boardId) return;
    try {
      await addItem(boardId, newItemColumn, text);
    } catch (error) {
      handleError(error, 'カードの追加に失敗しました');
    }
  };

  if (!boardId) {
    return (
      <section className="mx-auto flex h-screen max-w-240 items-center justify-center px-4">
        <p className="text-destructive text-sm">ボードIDが指定されていません。</p>
      </section>
    );
  }

  return (
    <>
      <title>{board?.name ? `${board.name} - Simple KPT` : 'KPT Board - Simple KPT'}</title>
      <BoardProvider boardId={boardId}>
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <KPTBoardActions />

          <section className="mx-auto flex h-full w-full max-w-480 flex-col p-8">
            <KPTBoardHeader />

            {loadError && (
              <div className="py-4">
                <ErrorAlert message="ボード情報の読み込みに失敗しました">
                  <ErrorAlertAction>
                    <Button size="sm" variant="destructive" onClick={() => window.location.reload()}>
                      再読み込み
                    </Button>
                  </ErrorAlertAction>
                </ErrorAlert>
              </div>
            )}

            <div className="flex-none pt-4">
              <FilterBar
                filterTag={filter.tag}
                filterMemberName={filter.memberId ? memberNicknameMap[filter.memberId] || '不明なメンバー' : null}
                onRemoveTag={() => setFilterTag(null)}
                onRemoveMember={() => setFilterMemberId(null)}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-stretch gap-x-4 gap-y-4 overflow-y-auto py-4 lg:flex-row">
              <KPTBoardColumns itemsByColumn={itemsByColumn} onCardClick={handleCardClick} />
            </div>

            <div className="flex-none pt-4">
              <ItemAddForm
                columns={columns}
                selectedColumn={newItemColumn}
                onColumnChange={setNewItemColumn}
                onSubmit={handleAddCard}
                disabled={isAdding || isLoading}
              />
            </div>
          </section>

          {/* ドラッグ中にポインタに追従するカード */}
          <DragOverlay>{activeItem ? <KPTCard item={activeItem} /> : null}</DragOverlay>

          <ItemDetailPanel item={selectedItem} onClose={handleClosePanel} />
        </DndContext>
      </BoardProvider>
    </>
  );
}
