import { Clipboard, ClipboardCheck, Download, FileDown, RotateCcw } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Label } from '@/components/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { copyToClipboard, downloadFile, generateCSV, generateMarkdown } from '@/lib/export-helpers';
import { createBoardFile, serializeBoardFile } from '@/lib/p2p/board-file';

import type { KptItem } from '@/types/kpt';

/** 記録・共有用の形式（再開用のJSONは用途が異なるため別に扱う） */
type ExportFormat = 'markdown' | 'csv';

const FILE_TYPES: Record<ExportFormat | 'json', { extension: string; mimeType: string }> = {
  markdown: { extension: 'md', mimeType: 'text/markdown' },
  csv: { extension: 'csv', mimeType: 'text/csv' },
  json: { extension: 'json', mimeType: 'application/json' },
};

/** ダウンロードするファイル名の先頭に付ける文字列（どのアプリのファイルか分かるようにするため） */
const DOWNLOAD_FILENAME_PREFIX = 'simplekpt_';

interface ExportDialogProps {
  boardName: string;
  items: KptItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** エクスポートした際に呼び出す（ダウンロード・クリップボードへのコピーのいずれも含む） */
  onExport?: () => void;
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
export function ExportDialog({ boardName, items, isOpen, onOpenChange, onExport }: ExportDialogProps): ReactElement {
  const { t } = useTranslation('board');
  const [format, setFormat] = useState<ExportFormat>('markdown');

  const generateContent = () => (format === 'markdown' ? generateMarkdown(boardName, items, t) : generateCSV(items, t));

  const download = (content: string, type: keyof typeof FILE_TYPES) => {
    const { extension, mimeType } = FILE_TYPES[type];
    downloadFile(content, `${DOWNLOAD_FILENAME_PREFIX}${boardName}_${generateTimestamp()}.${extension}`, mimeType);
    toast.success(t('ファイルをダウンロードしました'), {
      icon: <Download className="h-4 w-4" />,
    });
    onExport?.();
    onOpenChange(false);
  };

  const handleDownload = () => download(generateContent(), format);

  const handleSaveResumeFile = () => download(serializeBoardFile(createBoardFile(boardName, items)), 'json');

  const handleCopyToClipboard = async () => {
    const content = generateContent();

    try {
      await copyToClipboard(content);
      toast.success(t('クリップボードにコピーしました'), {
        icon: <ClipboardCheck className="h-4 w-4" />,
      });
      onExport?.();
      onOpenChange(false);
    } catch {
      toast.error(t('error:コピーに失敗しました'));
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

        <div className="flex flex-col gap-5 pt-2">
          {/* 記録・共有用 */}
          <section className="flex flex-col gap-3" aria-labelledby="export-share-heading">
            <div>
              <h3 id="export-share-heading" className="text-[13.5px] font-bold">
                {t('記録・共有用')}
              </h3>
              <p className="text-muted-foreground-subtle mt-0.5 text-xs">
                {t('議事録として残したり、チャットに貼り付けたりするための形式です。')}
              </p>
            </div>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)} className="grid grid-cols-2 gap-3">
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
          </section>

          <hr className="border-border-subtle" />

          {/* 再開用（用途が異なるため、記録・共有用の形式とは分けて表示する） */}
          <section className="bg-surface-subtle flex flex-col gap-3 rounded-xl p-4" aria-labelledby="export-resume-heading">
            <div className="flex gap-2.5">
              <RotateCcw className="text-primary mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              <div>
                <h3 id="export-resume-heading" className="text-[13.5px] font-bold">
                  {t('あとで続きから再開する')}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {t('Simple KPTで続きから再開するためのファイルです。ボード作成画面で読み込むと、このボードの続きから始められます。')}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSaveResumeFile} className="bg-card h-11 w-full text-[14.5px]">
              <FileDown className="h-4 w-4" />
              {t('再開用ファイルを保存（JSON）')}
            </Button>
          </section>

          {/* カード数表示 */}
          <p className="text-muted-foreground-subtle text-center text-[12.5px]">
            {t('{{count}}件のカードをエクスポートします', { count: items.length })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
