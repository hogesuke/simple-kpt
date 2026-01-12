import { Loader2 } from 'lucide-react';
import { ReactElement } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';

interface BoardDeleteDialogProps {
  /**
   * 削除対象のボード名
   */
  boardName: string;
  /**
   * 削除処理中かどうか
   */
  isDeleting: boolean;
  /**
   * 削除処理のコールバック
   */
  onDelete: () => void | Promise<void>;
  /**
   * ダイアログの開閉状態
   */
  isOpen: boolean;
  /**
   * ダイアログの開閉状態を変更するコールバック
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * ボード削除時の確認ダイアログ
 */
export function BoardDeleteDialog({ boardName, isDeleting, onDelete, isOpen, onOpenChange }: BoardDeleteDialogProps): ReactElement {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>削除の確認</AlertDialogTitle>
          <AlertDialogDescription>
            「{boardName}」を削除してもよろしいですか？
            <br />
            この操作は取り消すことができません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
