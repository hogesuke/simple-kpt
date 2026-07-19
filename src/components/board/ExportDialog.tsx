import { Clipboard, ClipboardCheck, Download } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Label } from '@/components/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { copyToClipboard, downloadFile, generateCSV, generateMarkdown } from '@/lib/export-helpers';

import type { KptItem } from '@/types/kpt';

type ExportFormat = 'markdown' | 'csv';

interface ExportDialogProps {
  boardName: string;
  items: KptItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ファイル名用の日時文字列を生成する
 */
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * エクスポートダイアログ
 */
export function ExportDialog({ boardName, items, isOpen, onOpenChange }: ExportDialogProps): ReactElement {
  const { t } = useTranslation('board');
  const [format, setFormat] = useState<ExportFormat>('markdown');

  const generateContent = () => {
    if (format === 'markdown') {
      return generateMarkdown(boardName, items, t);
    }
    return generateCSV(items, t);
  };

  const handleDownload = () => {
    const content = generateContent();
    const extension = format === 'markdown' ? 'md' : 'csv';
    const mimeType = format === 'markdown' ? 'text/markdown' : 'text/csv';
    const timestamp = generateTimestamp();
    const filename = `${boardName}_${timestamp}.${extension}`;

    downloadFile(content, filename, mimeType);
    toast.success(t('ファイルをダウンロードしました'), {
      icon: <Download className="h-4 w-4" />,
    });
    onOpenChange(false);
  };

  const handleCopyToClipboard = async () => {
    const content = generateContent();

    try {
      await copyToClipboard(content);
      toast.success(t('クリップボードにコピーしました'), {
        icon: <ClipboardCheck className="h-4 w-4" />,
      });
      onOpenChange(false);
    } catch {
      toast.error(t('コピーに失敗しました'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Download className="text-primary h-5 w-5" />
            {t('エクスポート')}
          </DialogTitle>
          <DialogDescription className="text-[13.5px]">{t('ボードのカードをエクスポートします。')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* 形式選択 */}
          <div className="flex flex-col gap-2">
            <span className="text-[13.5px] font-bold">{t('形式')}</span>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="mb-[18px] grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="format-markdown"
                className={`has-focus-visible:ring-ring cursor-pointer rounded-xl px-[18px] py-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-offset-1 ${
                  format === 'markdown' ? 'border-primary bg-surface-subtle border-2' : 'border-border hover:border-input border'
                }`}
              >
                <RadioGroupItem value="markdown" id="format-markdown" className="sr-only" aria-label="Markdown" />
                <span className="block text-[14.5px] font-bold">Markdown</span>
                <span className="text-muted-foreground-subtle mt-0.5 block text-xs">{t('.md形式')}</span>
              </Label>
              <Label
                htmlFor="format-csv"
                className={`has-focus-visible:ring-ring cursor-pointer rounded-xl px-[18px] py-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-offset-1 ${
                  format === 'csv' ? 'border-primary bg-surface-subtle border-2' : 'border-border hover:border-input border'
                }`}
              >
                <RadioGroupItem value="csv" id="format-csv" className="sr-only" aria-label="CSV" />
                <span className="block text-[14.5px] font-bold">CSV</span>
                <span className="text-muted-foreground-subtle mt-0.5 block text-xs">{t('表形式')}</span>
              </Label>
            </RadioGroup>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col gap-2.5">
            <Button onClick={handleDownload} className="h-11 w-full text-[14.5px]">
              <Download className="h-4 w-4" />
              {t('ダウンロード')}
            </Button>
            <Button variant="outline" onClick={handleCopyToClipboard} className="h-11 w-full text-[14.5px]">
              <Clipboard className="h-4 w-4" />
              {t('クリップボードにコピー')}
            </Button>
          </div>

          {/* カード数表示 */}
          <p className="text-muted-foreground-subtle mt-4 text-center text-[12.5px]">
            {t('{{count}}件のカードをエクスポートします', { count: items.length })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
