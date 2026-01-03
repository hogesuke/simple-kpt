import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BoardDeleteDialog } from '@/components/BoardDeleteDialog';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/shadcn/dropdown-menu';
import { Input } from '@/components/ui/shadcn/input';
import { createBoard, deleteBoard, fetchBoards } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

import type { KptBoard } from '@/types/kpt';

export function Home(): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [boards, setBoards] = useState<KptBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ [key: string]: boolean }>({});

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setBoardName('');
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const loadBoards = async () => {
      try {
        setIsLoading(true);
        const data = await fetchBoards();
        setBoards(data);
      } catch (error) {
        window.alert('ボードの読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    void loadBoards();
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const name = boardName.trim();
    if (!name || isCreating) return;

    try {
      setIsCreating(true);
      const board = await createBoard(name);
      setBoards((prev) => [board, ...prev]);
      setIsDialogOpen(false);
      setBoardName('');
      navigate(`/board/${board.id}`);
    } catch (error) {
      // TODO: エラーハンドリングを改善する
      window.alert('ボードの作成に失敗しました。');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      setDeletingBoardId(boardId);
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (error) {
      window.alert('ボードの削除に失敗しました。');
    } finally {
      setDeletingBoardId(null);
    }
  };

  return (
    <section className="mx-auto max-w-240 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">マイボード</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button type="button">
              <Plus className="mr-2 h-4 w-4" />
              ボードを作成
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいボードを作成</DialogTitle>
              <DialogDescription>ボードの名前を入力してください。</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="boardName" className="block text-sm font-medium">
                  ボード名
                  <span className="text-red-500"> *</span>
                </label>
                <Input
                  id="boardName"
                  // NOTE: 本来はautoFocusの使用は極力避けるべきだが、モーダルを開いた際の利便性を重視し例外として許容する
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g. 2025/01 チーム振り返り"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isCreating}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={!boardName.trim() || isCreating}>
                  {isCreating ? '作成中...' : '作成'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center">読み込み中...</div>
      ) : boards.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-12 text-center">
          <p className="mb-4">まだボードがありません</p>
          <Button type="button" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            最初のボードを作成
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => {
            const isOwner = user?.id === board.ownerId;
            return (
              <div key={board.id} className="relative">
                <button
                  type="button"
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="w-full rounded-lg border bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="font-semibold">{board.name}</h3>
                </button>
                {isOwner && (
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-muted h-8 w-8" aria-label="ボード操作メニュー">
                          <MoreHorizontal className="text-muted-foreground h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDialogOpen((prev) => ({ ...prev, [board.id]: true }))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <BoardDeleteDialog
                  boardName={board.name}
                  isDeleting={deletingBoardId === board.id}
                  onDelete={() => handleDeleteBoard(board.id)}
                  open={deleteDialogOpen[board.id] || false}
                  onOpenChange={(open) => setDeleteDialogOpen((prev) => ({ ...prev, [board.id]: open }))}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
