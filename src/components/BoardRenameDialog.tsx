import { Loader2 } from 'lucide-react';
import { ReactElement, useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';

interface BoardRenameDialogProps {
  /**
   * 現在のボード名
   */
  boardName: string;
  /**
   * 更新処理中かどうか
   */
  isUpdating: boolean;
  /**
   * 更新処理のコールバック
   */
  onRename: (newName: string) => void | Promise<void>;
  /**
   * ダイアログの開閉状態
   */
  open: boolean;
  /**
   * ダイアログの開閉状態を変更するコールバック
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * ボード名変更ダイアログ
 */
export function BoardRenameDialog({ boardName, isUpdating, onRename, open, onOpenChange }: BoardRenameDialogProps): ReactElement {
  const [newName, setNewName] = useState(boardName);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isUpdating) {
      // ダイアログが開くときに現在のボード名をセットする
      if (newOpen) {
        setNewName(boardName);
      }
      onOpenChange(newOpen);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const trimmedName = newName.trim();
    if (!trimmedName || isUpdating) return;

    await onRename(trimmedName);
  };

  const isUnchanged = newName.trim() === boardName;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ボード名を変更</DialogTitle>
          <DialogDescription>新しいボード名を入力してください。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="newBoardName" className="block text-sm font-medium">
              ボード名
              <span className="text-red-500"> *</span>
            </label>
            <Input
              id="newBoardName"
              // NOTE: 本来はautoFocusの使用は極力避けるべきだが、モーダルを開いた際の利便性を重視し例外として許容する
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isUpdating}>
              キャンセル
            </Button>
            <Button type="submit" disabled={!newName.trim() || isUnchanged || isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
              変更
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
