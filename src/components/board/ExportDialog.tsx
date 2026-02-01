import { Clipboard, ClipboardCheck, Download } from 'lucide-react';
import { ReactElement, useState } from 'react';
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
  const [format, setFormat] = useState<ExportFormat>('markdown');

  const generateContent = () => {
    if (format === 'markdown') {
      return generateMarkdown(boardName, items);
    }
    return generateCSV(items);
  };

  const handleDownload = () => {
    const content = generateContent();
    const extension = format === 'markdown' ? 'md' : 'csv';
    const mimeType = format === 'markdown' ? 'text/markdown' : 'text/csv';
    const timestamp = generateTimestamp();
    const filename = `${boardName}_${timestamp}.${extension}`;

    downloadFile(content, filename, mimeType);
    toast.success('ファイルをダウンロードしました', {
      icon: <Download className="h-4 w-4" />,
    });
    onOpenChange(false);
  };

  const handleCopyToClipboard = async () => {
    const content = generateContent();

    try {
      await copyToClipboard(content);
      toast.success('クリップボードにコピーしました', {
        icon: <ClipboardCheck className="h-4 w-4" />,
      });
      onOpenChange(false);
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>エクスポート</DialogTitle>
          <DialogDescription>ボードのカードをエクスポートします。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* 形式選択 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">形式</span>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)} className="grid grid-cols-2 gap-3">
              <Label
                htmlFor="format-markdown"
                className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                  format === 'markdown' ? 'border-primary bg-primary/5' : 'border-input hover:border-muted-foreground/50 hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="markdown" id="format-markdown" className="sr-only" />
                <span className="block text-sm font-medium">Markdown</span>
                <span className="text-muted-foreground block text-xs">.md形式</span>
              </Label>
              <Label
                htmlFor="format-csv"
                className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                  format === 'csv' ? 'border-primary bg-primary/5' : 'border-input hover:border-muted-foreground/50 hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="csv" id="format-csv" className="sr-only" />
                <span className="block text-sm font-medium">CSV</span>
                <span className="text-muted-foreground block text-xs">表形式</span>
              </Label>
            </RadioGroup>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} className="w-full">
              <Download className="h-4 w-4" />
              ダウンロード
            </Button>
            <Button variant="outline" onClick={handleCopyToClipboard} className="w-full">
              <Clipboard className="h-4 w-4" />
              クリップボードにコピー
            </Button>
          </div>

          {/* カード数表示 */}
          <p className="text-muted-foreground text-center text-sm">{items.length}件のカードをエクスポートします</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
