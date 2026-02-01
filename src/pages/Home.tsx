import { Plus, User } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { BoardCreateDialog } from '@/components/board/BoardCreateDialog';
import { BoardTableRow } from '@/components/board/BoardTableRow';
import { BoardTableRowSkeleton } from '@/components/board/BoardTableRowSkeleton';
import { LoadMoreButton } from '@/components/forms/LoadMoreButton';
import { FilterChip } from '@/components/kpt/FilterChip';
import { StatsSummary } from '@/components/kpt/StatsSummary';
import { StatusFilter } from '@/components/kpt/StatusFilter';
import { TryItemsTable } from '@/components/kpt/TryItemsTable';
import { ErrorAlert, ErrorAlertAction } from '@/components/layout/ErrorAlert';
import { Button } from '@/components/shadcn/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { useDeleteBoard } from '@/hooks/useDeleteBoard';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { updateBoard } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useHomeStore } from '@/stores/useHomeStore';

import type { KptBoard, TryStatus } from '@/types/kpt';

export function Home(): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { handleError } = useErrorHandler();

  // ストアからstate取得
  const activeTab = useHomeStore((state) => state.activeTab);
  const setActiveTab = useHomeStore((state) => state.setActiveTab);
  const boards = useHomeStore((state) => state.boards);
  const isBoardsLoading = useHomeStore((state) => state.isBoardsLoading);
  const isBoardsLoadingMore = useHomeStore((state) => state.isBoardsLoadingMore);
  const boardsError = useHomeStore((state) => state.boardsError);
  const boardsHasMore = useHomeStore((state) => state.boardsHasMore);
  const loadBoards = useHomeStore((state) => state.loadBoards);
  const addBoard = useHomeStore((state) => state.addBoard);
  const updateBoardInStore = useHomeStore((state) => state.updateBoard);
  const removeBoard = useHomeStore((state) => state.removeBoard);
  const tryItems = useHomeStore((state) => state.tryItems);
  const isTryLoading = useHomeStore((state) => state.isTryLoading);
  const isTryLoadingMore = useHomeStore((state) => state.isTryLoadingMore);
  const tryError = useHomeStore((state) => state.tryError);
  const tryHasMore = useHomeStore((state) => state.tryHasMore);
  const filterStatuses = useHomeStore((state) => state.filterStatuses);
  const setFilterStatuses = useHomeStore((state) => state.setFilterStatuses);
  const filterAssignee = useHomeStore((state) => state.filterAssignee);
  const setFilterAssignee = useHomeStore((state) => state.setFilterAssignee);
  const loadTryItems = useHomeStore((state) => state.loadTryItems);
  const hasTryLoaded = useHomeStore((state) => state.hasTryLoaded);

  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);

  const { handleDeleteBoard, deletingBoardId } = useDeleteBoard({
    onSuccess: (boardId) => {
      removeBoard(boardId);
    },
  });

  // ボードの初回ロード
  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  // Tryアイテムのロード（Tryタブがアクティブで未読み込みの場合）
  useEffect(() => {
    if (activeTab === 'try' && !hasTryLoaded && !isTryLoading) {
      void loadTryItems();
    }
  }, [activeTab, hasTryLoaded, isTryLoading, loadTryItems]);

  useEffect(() => {
    return () => {
      useHomeStore.setState({ hasTryLoaded: false });
    };
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value as 'boards' | 'try';
    setActiveTab(tab);
    if (tab === 'try' && !hasTryLoaded && !isTryLoading) {
      void loadTryItems();
    }
  };

  const handleStatusChange = (statuses: TryStatus[]) => {
    setFilterStatuses(statuses);
    void loadTryItems();
  };

  const handleAssigneeClick = (assigneeId: string, assigneeNickname: string) => {
    setFilterAssignee({ id: assigneeId, nickname: assigneeNickname });
    void loadTryItems();
  };

  const handleClearAssigneeFilter = () => {
    setFilterAssignee(null);
    void loadTryItems();
  };

  const handleBoardCreated = (board: KptBoard) => {
    addBoard(board);
    navigate(`/boards/${board.id}`, { state: { justCreated: true } });
  };

  const handleRenameBoard = async (boardId: string, newName: string) => {
    try {
      setRenamingBoardId(boardId);
      const updatedBoard = await updateBoard(boardId, newName);
      updateBoardInStore(boardId, updatedBoard);
    } catch (error) {
      handleError(error, 'ボード名の変更に失敗しました');
    } finally {
      setRenamingBoardId(null);
    }
  };

  const handleLoadMoreBoards = () => {
    if (isBoardsLoadingMore || !boardsHasMore) return;
    void loadBoards(false);
  };

  const handleLoadMoreTryItems = () => {
    if (isTryLoadingMore || !tryHasMore) return;
    void loadTryItems(false);
  };

  return (
    <>
      <title>ボード一覧 - Simple KPT</title>
      <section className="mx-auto max-w-7xl px-4 py-8">
        <StatsSummary />
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="mb-6 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="boards">ボードリスト</TabsTrigger>
              <TabsTrigger value="try">Tryリスト</TabsTrigger>
            </TabsList>
            <BoardCreateDialog onBoardCreated={handleBoardCreated} />
          </div>

          <TabsContent value="boards">
            {boardsError && (
              <div className="mb-6">
                <ErrorAlert message={boardsError}>
                  <ErrorAlertAction>
                    <Button size="sm" variant="destructive" onClick={() => window.location.reload()}>
                      再読み込み
                    </Button>
                  </ErrorAlertAction>
                </ErrorAlert>
              </div>
            )}

            {isBoardsLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ボード名</TableHead>
                    <TableHead className="w-24">ロール</TableHead>
                    <TableHead className="w-28">作成日</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(4)].map((_, i) => (
                    <BoardTableRowSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            ) : boards.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-dashed p-12 text-center">
                <p className="mb-4">まだボードがありません</p>
                <BoardCreateDialog
                  onBoardCreated={handleBoardCreated}
                  trigger={
                    <Button type="button">
                      <Plus className="h-4 w-4" />
                      最初のボードを作成
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ボード名</TableHead>
                      <TableHead className="w-24">ロール</TableHead>
                      <TableHead className="w-28">作成日</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boards.map((board) => (
                      <BoardTableRow
                        key={board.id}
                        board={board}
                        isOwner={user?.id === board.ownerId}
                        isDeleting={deletingBoardId === board.id}
                        isRenaming={renamingBoardId === board.id}
                        onDelete={() => handleDeleteBoard(board.id)}
                        onRename={(newName) => handleRenameBoard(board.id, newName)}
                      />
                    ))}
                  </TableBody>
                </Table>
                {boardsHasMore && <LoadMoreButton onClick={handleLoadMoreBoards} isLoading={isBoardsLoadingMore} />}
              </>
            )}
          </TabsContent>

          <TabsContent value="try">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <StatusFilter selectedStatuses={filterStatuses} onStatusChange={handleStatusChange} />
              {filterAssignee && (
                <FilterChip icon={<User className="h-3 w-3" />} label={filterAssignee.nickname} onRemove={handleClearAssigneeFilter} />
              )}
            </div>

            {tryError && (
              <div className="mb-6">
                <ErrorAlert message={tryError}>
                  <ErrorAlertAction>
                    <Button size="sm" variant="destructive" onClick={() => loadTryItems()}>
                      再読み込み
                    </Button>
                  </ErrorAlertAction>
                </ErrorAlert>
              </div>
            )}

            {!tryError && (
              <>
                <TryItemsTable items={tryItems} isLoading={isTryLoading} onAssigneeClick={handleAssigneeClick} />
                {tryHasMore && !isTryLoading && <LoadMoreButton onClick={handleLoadMoreTryItems} isLoading={isTryLoadingMore} />}
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
