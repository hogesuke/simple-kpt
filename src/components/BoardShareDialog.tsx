import { Check, Copy } from 'lucide-react';
import { ReactElement, useCallback, useState } from 'react';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface BoardShareDialogProps {
  boardId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ボード共有ダイアログ
 */
export function BoardShareDialog({ boardId, isOpen, onOpenChange }: BoardShareDialogProps): ReactElement {
  const [copied, setCopied] = useState(false);
  const { handleError } = useErrorHandler();

  const shareUrl = `${window.location.origin}/boards/${boardId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      handleError(error, 'URLのコピーに失敗しました');
    }
  }, [handleError, shareUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">ボードを共有</DialogTitle>
          <DialogDescription>
            ボードが作成されました。
            <br />
            URLを共有して、ボードにメンバーを招待しましょう。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              readOnly
              aria-readonly="true"
              value={shareUrl}
              className="bg-muted flex-1 rounded-md border px-3 py-2 text-sm"
              onClick={(e) => e.currentTarget.select()}
              aria-label="共有URL（クリックで選択）"
            />
            <Button size="sm" variant="outline" onClick={handleCopy} aria-label={copied ? 'コピー済み' : 'URLをコピー'}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">このURLを知っている人はボードに参加できます。</p>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
