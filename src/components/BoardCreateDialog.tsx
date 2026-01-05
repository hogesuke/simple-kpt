import { Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';

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
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createBoard } from '@/lib/kpt-api';

import type { KptBoard } from '@/types/kpt';

interface BoardCreateDialogProps {
  onBoardCreated: (board: KptBoard) => void;
  trigger?: ReactElement;
}

/**
 * ボード作成ダイアログ
 */
export function BoardCreateDialog({ onBoardCreated, trigger }: BoardCreateDialogProps): ReactElement {
  const { handleError } = useErrorHandler();
  const [isOpen, setIsOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
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
      setIsOpen(false);
      setBoardName('');
      onBoardCreated(board);
    } catch (error) {
      handleError(error, 'ボードの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const defaultTrigger = (
    <Button type="button">
      <Plus className="mr-2 h-4 w-4" />
      ボードを作成
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

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
  );
}
