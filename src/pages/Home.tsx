import { Plus } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BoardCard } from '@/components/BoardCard';
import { BoardCreateDialog } from '@/components/BoardCreateDialog';
import { ErrorAlert, ErrorAlertAction } from '@/components/ui/ErrorAlert';
import { Button } from '@/components/ui/shadcn/button';
import { useDeleteBoard } from '@/hooks/useDeleteBoard';
import { fetchBoards } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

import type { KptBoard } from '@/types/kpt';

export function Home(): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [boards, setBoards] = useState<KptBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        <div className="text-muted-foreground text-center">読み込み中...</div>
      ) : boards.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-12 text-center">
          <p className="mb-4">まだボードがありません</p>
          <BoardCreateDialog
            onBoardCreated={handleBoardCreated}
            trigger={
              <Button type="button">
                <Plus className="mr-2 h-4 w-4" />
                最初のボードを作成
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isOwner={user?.id === board.ownerId}
              isDeleting={deletingBoardId === board.id}
              onDelete={() => handleDeleteBoard(board.id)}
              onClick={() => navigate(`/board/${board.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
