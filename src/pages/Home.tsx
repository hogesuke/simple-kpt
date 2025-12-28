import { LogOut, Plus } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { Input } from '@/components/ui/shadcn/input';
import { createBoard, fetchBoards } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

import type { KptBoard } from '@/types/kpt';

export function Home(): ReactElement {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const [boards, setBoards] = useState<KptBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      window.alert('ログアウトに失敗しました。');
    }
  };

  return (
    <section className="mx-auto min-h-screen max-w-240 px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPT App</h1>
          {profile && <p className="text-muted-foreground mt-1 text-sm">{profile.nickname}</p>}
        </div>
        <Button type="button" variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </header>

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
          {boards.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => navigate(`/board/${board.id}`)}
              className="rounded-lg border bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold">{board.name}</h3>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
