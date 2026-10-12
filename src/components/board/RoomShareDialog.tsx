import { ClipboardCheck, Copy, Link as LinkIcon } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { copyToClipboard } from '@/lib/export-helpers';

interface RoomShareDialogProps {
  /** 共有するボードのURL（#以降の鍵を含む） */
  roomUrl: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ボード作成直後に、参加者に共有するURLを案内するダイアログ
 */
export function RoomShareDialog({ roomUrl, isOpen, onOpenChange }: RoomShareDialogProps): ReactElement {
  const { t } = useTranslation('room');

  const handleCopy = async () => {
    try {
      await copyToClipboard(roomUrl);
      toast.success(t('招待URLをコピーしました'), {
        icon: <ClipboardCheck className="h-4 w-4" />,
      });
    } catch {
      toast.error(t('招待URLのコピーに失敗しました'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <LinkIcon className="text-primary h-5 w-5" />
            {t('ボードを作成しました')}
          </DialogTitle>
          <DialogDescription className="text-[13.5px]">{t('このURLを参加者に共有してください。')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Label htmlFor="room-share-url" className="sr-only">
            {t('招待URL')}
          </Label>
          <div className="flex gap-2">
            <Input
              id="room-share-url"
              value={roomUrl}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 font-mono text-xs"
            />
            <Button onClick={() => void handleCopy()} className="h-11 flex-none">
              <Copy className="h-4 w-4" />
              {t('コピー')}
            </Button>
          </div>
        </div>

        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-[12.5px]">
          <li>{t('URLを知っている人は誰でもボードに参加できます。')}</li>
          <li>
            {t(
              'ボードの内容はサーバーに保存されず、参加者の端末にのみ保存されます。このURLを開き直すと続きから再開できますが、記録として残す場合はエクスポートしてください。'
            )}
          </li>
          <li>{t('このURLは、ヘッダーの「招待URLをコピー」からいつでもコピーできます。')}</li>
        </ul>

        <DialogFooter>
          <Button className="h-11" variant="outline" onClick={() => onOpenChange(false)}>
            {t('閉じる')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
