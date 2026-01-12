import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ArrowLeft, Download, Pencil, Settings, Trash2 } from 'lucide-react';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { BoardDeleteDialog } from '@/components/BoardDeleteDialog';
import { BoardMembersDialog } from '@/components/BoardMembersDialog';
import { BoardRenameDialog } from '@/components/BoardRenameDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { FilterBar } from '@/components/FilterBar';
import { HeaderActions } from '@/components/HeaderActions';
import { ItemAddForm } from '@/components/ItemAddForm';
import { KPTColumnSkeleton } from '@/components/KPTColumnSkeleton';
import { Timer } from '@/components/Timer';
import { BoardColumn } from '@/components/ui/BoardColumn';
import { ErrorAlert, ErrorAlertAction } from '@/components/ui/ErrorAlert';
import { ItemDetailPanel } from '@/components/ui/ItemDetailPanel';
import { KPTCard } from '@/components/ui/KPTCard';
import { Button } from '@/components/ui/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/shadcn/dropdown-menu';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useDeleteBoard } from '@/hooks/useDeleteBoard';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { selectActiveItem, selectItemsByColumn } from '@/lib/item-selectors';
import { updateBoard } from '@/lib/kpt-api';
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
  const deleteItem = useBoardStore((state) => state.deleteItem);
  const updateItem = useBoardStore((state) => state.updateItem);
  const subscribeToItemEvents = useBoardStore((state) => state.subscribeToItemEvents);
  const setSelectedItem = useBoardStore((state) => state.setSelectedItem);
  const setFilterTag = useBoardStore((state) => state.setFilterTag);
  const setFilterMemberId = useBoardStore((state) => state.setFilterMemberId);
  const memberNicknameMap = useBoardStore((state) => state.memberNicknameMap);
  const timerState = useBoardStore((state) => state.timerState);
  const subscribeToTimerEvents = useBoardStore((state) => state.subscribeToTimerEvents);
  const reset = useBoardStore((state) => state.reset);

  const [newItemColumn, setNewItemColumn] = useState<KptColumnType>('keep');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [localHideOthersCards, setLocalHideOthersCards] = useState(false);

  const { handleDeleteBoard, deletingBoardId } = useDeleteBoard({
    onSuccess: () => {
      navigate('/', { replace: true });
    },
  });

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
      navigate('/', { replace: true });
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

  const handleItemDrop = useCallback(
    async (item: KptItem) => {
      try {
        await updateItem(item);
      } catch (error) {
        handleError(error, 'カード位置の更新に失敗しました');
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

  const handleDeleteItem = async (id: string) => {
    if (!boardId) return;
    try {
      await deleteItem(id, boardId);
    } catch (error) {
      handleError(error, 'カードの削除に失敗しました');
    }
  };

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

  const handleTagClick = useCallback(
    (tag: string) => {
      setFilterTag(tag);
    },
    [setFilterTag]
  );

  const handleMemberClick = useCallback(
    (memberId: string) => {
      setFilterMemberId(memberId);
    },
    [setFilterMemberId]
  );

  const handleRenameBoard = async (newName: string) => {
    if (!boardId) return;
    try {
      setIsRenaming(true);
      const updatedBoard = await updateBoard(boardId, newName);
      useBoardStore.setState({ currentBoard: updatedBoard });
      setRenameDialogOpen(false);
    } catch (error) {
      handleError(error, 'ボード名の変更に失敗しました');
    } finally {
      setIsRenaming(false);
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
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <HeaderActions>
        <BoardMembersDialog boardId={boardId} disabled={isLoading} />
        <Button variant="ghost" size="sm" onClick={() => setExportDialogOpen(true)} disabled={isLoading || !board}>
          <Download className="h-4 w-4" />
          エクスポート
        </Button>
        {user?.id && (!board || user.id === board.ownerId) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-muted" aria-label="ボード設定" disabled={isLoading || !board}>
                <Settings className="text-muted-foreground h-4 w-4" />
                ボード設定
              </Button>
            </DropdownMenuTrigger>
            {!isLoading && board && (
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  ボード名を変更
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        )}
      </HeaderActions>

      <section className="mx-auto flex h-full w-full max-w-480 flex-col p-8">
        <header className="flex-none">
          <nav className="mb-2">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              ボードリストに戻る
            </Link>
          </nav>
          <div className="flex items-center justify-between gap-4">
            {isLoading ? <Skeleton className="h-8 w-48" /> : <h1 className="text-2xl font-semibold">{board ? board.name : 'KPT Board'}</h1>}

            {/* タイマー */}
            {!isLoading && board && <Timer boardId={boardId} timerState={timerState} disabled={isLoading} />}
          </div>
        </header>

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

        {/* フィルターバー */}
        <div className="flex-none pt-4">
          <FilterBar
            filterTag={filter.tag}
            filterMemberName={filter.memberId ? memberNicknameMap[filter.memberId] || '不明なメンバー' : null}
            onRemoveTag={() => setFilterTag(null)}
            onRemoveMember={() => setFilterMemberId(null)}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-stretch gap-x-4 gap-y-4 overflow-y-auto py-4 lg:flex-row">
          {isLoading ? (
            <>
              <KPTColumnSkeleton />
              <KPTColumnSkeleton />
              <KPTColumnSkeleton />
            </>
          ) : (
            <>
              <BoardColumn
                column="keep"
                items={itemsByColumn.keep}
                selectedItemId={selectedItem?.id}
                onDeleteItem={handleDeleteItem}
                onCardClick={handleCardClick}
                onTagClick={handleTagClick}
                onMemberClick={handleMemberClick}
              />
              <BoardColumn
                column="problem"
                items={itemsByColumn.problem}
                selectedItemId={selectedItem?.id}
                onDeleteItem={handleDeleteItem}
                onCardClick={handleCardClick}
                onTagClick={handleTagClick}
                onMemberClick={handleMemberClick}
              />
              <BoardColumn
                column="try"
                items={itemsByColumn.try}
                selectedItemId={selectedItem?.id}
                onDeleteItem={handleDeleteItem}
                onCardClick={handleCardClick}
                onTagClick={handleTagClick}
                onMemberClick={handleMemberClick}
              />
            </>
          )}
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

      {/* カード詳細パネル */}
      <ItemDetailPanel item={selectedItem} onClose={handleClosePanel} />

      {/* ボード削除確認ダイアログ */}
      {board && (
        <BoardDeleteDialog
          boardName={board.name}
          isDeleting={deletingBoardId !== null}
          onDelete={() => handleDeleteBoard(boardId)}
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}

      {/* ボード名変更ダイアログ */}
      {board && (
        <BoardRenameDialog
          boardName={board.name}
          isUpdating={isRenaming}
          onRename={handleRenameBoard}
          isOpen={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
        />
      )}

      {/* エクスポートダイアログ */}
      {board && <ExportDialog boardName={board.name} items={items} isOpen={exportDialogOpen} onOpenChange={setExportDialogOpen} />}
    </DndContext>
  );
}
