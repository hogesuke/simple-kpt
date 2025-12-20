import { ReactElement, useState } from 'react';
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
import { createBoard } from '@/lib/kpt-api';

export function Home(): ReactElement {
  const navigate = useNavigate();
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

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const name = boardName.trim();
    if (!name || isCreating) return;

    try {
      setIsCreating(true);
      const board = await createBoard(name);
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

  return (
    <section className="mx-auto flex h-screen max-w-[960px] flex-col items-center justify-center gap-6 px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">KPT App</h1>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button type="button">ボードを作成</Button>
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
    </section>
  );
}
