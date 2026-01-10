import { Plus } from 'lucide-react';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { BoardCreateDialog } from '@/components/BoardCreateDialog';
import { BoardTableRow } from '@/components/BoardTableRow';
import { BoardTableRowSkeleton } from '@/components/BoardTableRowSkeleton';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { StatusFilter } from '@/components/StatusFilter';
import { TryItemsTable } from '@/components/TryItemsTable';
import { ErrorAlert, ErrorAlertAction } from '@/components/ui/ErrorAlert';
import { Button } from '@/components/ui/shadcn/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/shadcn/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { useDeleteBoard } from '@/hooks/useDeleteBoard';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetchBoards, fetchTryItems, updateBoard } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

import type { KptBoard, TryItemWithBoard, TryStatus } from '@/types/kpt';

const DEFAULT_STATUSES: TryStatus[] = ['pending', 'in_progress'];
const PAGE_SIZE = 20;

export function Home(): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { handleError } = useErrorHandler();
  const [boards, setBoards] = useState<KptBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [boardsCursor, setBoardsCursor] = useState<string | null>(null);
  const [boardsHasMore, setBoardsHasMore] = useState(false);

  // Tryリスト用のstate
  const [tryItems, setTryItems] = useState<TryItemWithBoard[]>([]);
  const [isTryLoading, setIsTryLoading] = useState(false);
  const [isTryLoadingMore, setIsTryLoadingMore] = useState(false);
  const [tryLoadError, setTryLoadError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<TryStatus[]>(DEFAULT_STATUSES);
  const [tryOffset, setTryOffset] = useState(0);
  const [tryHasMore, setTryHasMore] = useState(false);

  const { handleDeleteBoard, deletingBoardId } = useDeleteBoard({
    onSuccess: (boardId) => {
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    },
  });

  const loadBoards = useCallback(
    async (reset = true) => {
      if (!reset && (!boardsCursor || isLoadingMore)) return;
      try {
        if (reset) {
          setIsLoading(true);
          setLoadError(null);
        } else {
          setIsLoadingMore(true);
        }
        const cursor = reset ? undefined : boardsCursor;
        const response = await fetchBoards({ limit: PAGE_SIZE, cursor: cursor ?? undefined });
        if (reset) {
          setBoards(response.items);
        } else {
          setBoards((prev) => [...prev, ...response.items]);
        }
        setBoardsCursor(response.nextCursor);
        setBoardsHasMore(response.hasMore);
      } catch (error) {
        if (reset) {
          setLoadError('ボードリストの読み込みに失敗しました');
        } else {
          handleError(error, 'ボードリストの読み込みに失敗しました');
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [boardsCursor, isLoadingMore, handleError]
  );

  const loadMoreBoards = () => {
    if (isLoadingMore || !boardsHasMore) return;
    void loadBoards(false);
  };

  useEffect(() => {
    void loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回レンダリング時のみ実行
  }, []);

  const loadTryItems = useCallback(
    async (statuses: TryStatus[], reset = true) => {
      try {
        if (reset) {
          setIsTryLoading(true);
          setTryOffset(0);
        } else {
          setIsTryLoadingMore(true);
        }
        setTryLoadError(null);
        const offset = reset ? 0 : tryOffset;
        const response = await fetchTryItems({
          status: statuses.length > 0 ? statuses : undefined,
          limit: PAGE_SIZE,
          offset,
        });
        if (reset) {
          setTryItems(response.items);
        } else {
          setTryItems((prev) => [...prev, ...response.items]);
        }
        setTryOffset(offset + response.items.length);
        setTryHasMore(response.hasMore);
      } catch {
        setTryLoadError('Tryアイテムの読み込みに失敗しました');
      } finally {
        setIsTryLoading(false);
        setIsTryLoadingMore(false);
      }
    },
    [tryOffset]
  );

  const loadMoreTryItems = () => {
    if (isTryLoadingMore || !tryHasMore) return;
    void loadTryItems(selectedStatuses, false);
  };

  const handleTabChange = (value: string) => {
    if (value === 'try' && tryItems.length === 0 && !isTryLoading) {
      void loadTryItems(selectedStatuses);
    }
  };

  const handleStatusChange = (statuses: TryStatus[]) => {
    setSelectedStatuses(statuses);
    void loadTryItems(statuses);
  };

  const handleBoardCreated = (board: KptBoard) => {
    setBoards((prev) => [board, ...prev]);
    navigate(`/board/${board.id}`);
  };

  const handleRenameBoard = async (boardId: string, newName: string) => {
    try {
      setRenamingBoardId(boardId);
      const updatedBoard = await updateBoard(boardId, newName);
      setBoards((prev) => prev.map((board) => (board.id === boardId ? updatedBoard : board)));
    } catch (error) {
      handleError(error, 'ボード名の変更に失敗しました');
    } finally {
      setRenamingBoardId(null);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <Tabs defaultValue="boards" onValueChange={handleTabChange}>
        <div className="mb-6 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="boards">ボードリスト</TabsTrigger>
            <TabsTrigger value="try">Tryリスト</TabsTrigger>
          </TabsList>
          <BoardCreateDialog onBoardCreated={handleBoardCreated} />
        </div>

        <TabsContent value="boards">
          {loadError && (
            <div className="mb-6">
              <ErrorAlert message={loadError}>
                <ErrorAlertAction>
                  <Button size="sm" variant="destructive" onClick={() => window.location.reload()}>
                    再読み込み
                  </Button>
                </ErrorAlertAction>
              </ErrorAlert>
            </div>
          )}

          {isLoading ? (
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
                      onClick={() => navigate(`/board/${board.id}`)}
                    />
                  ))}
                </TableBody>
              </Table>
              {boardsHasMore && <LoadMoreButton onClick={loadMoreBoards} isLoading={isLoadingMore} />}
            </>
          )}
        </TabsContent>

        <TabsContent value="try">
          <div className="mb-4">
            <StatusFilter selectedStatuses={selectedStatuses} onStatusChange={handleStatusChange} />
          </div>

          {tryLoadError && (
            <div className="mb-6">
              <ErrorAlert message={tryLoadError}>
                <ErrorAlertAction>
                  <Button size="sm" variant="destructive" onClick={() => loadTryItems(selectedStatuses)}>
                    再読み込み
                  </Button>
                </ErrorAlertAction>
              </ErrorAlert>
            </div>
          )}

          {!tryLoadError && (
            <>
              <TryItemsTable items={tryItems} isLoading={isTryLoading} />
              {tryHasMore && !isTryLoading && <LoadMoreButton onClick={loadMoreTryItems} isLoading={isTryLoadingMore} />}
            </>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
