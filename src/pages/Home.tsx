import { Plus } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BoardCreateDialog } from '@/components/BoardCreateDialog';
import { BoardTableRow } from '@/components/BoardTableRow';
import { BoardTableRowSkeleton } from '@/components/BoardTableRowSkeleton';
import { ErrorAlert, ErrorAlertAction } from '@/components/ui/ErrorAlert';
import { Button } from '@/components/ui/shadcn/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/shadcn/table';
import { useDeleteBoard } from '@/hooks/useDeleteBoard';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetchBoards, updateBoard } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

import type { KptBoard } from '@/types/kpt';

export function Home(): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { handleError } = useErrorHandler();
  const [boards, setBoards] = useState<KptBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);

  const { handleDeleteBoard, deletingBoardId } = useDeleteBoard({
    onSuccess: (boardId) => {
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    },
  });

  useEffect(() => {
    const loadBoards = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchBoards();
        setBoards(data);
      } catch {
        setLoadError('ボード一覧の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    void loadBoards();
  }, []);

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
    <section className="mx-auto max-w-240 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">マイボード</h2>
        <BoardCreateDialog onBoardCreated={handleBoardCreated} />
      </div>

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
      )}
    </section>
  );
}
