import { Bot, Check, Copy, Info } from 'lucide-react';
import { ReactElement, useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface SummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: () => void;
  summary: string;
  remainingCount: number;
  isLoading?: boolean;
  boardName?: string;
}

/**
 * AIサマリー表示ダイアログ
 */
export function SummaryDialog({
  isOpen,
  onOpenChange,
  onGenerate,
  summary,
  remainingCount,
  isLoading,
  boardName,
}: SummaryDialogProps): ReactElement {
  const { t } = useTranslation('board');
  const [copied, setCopied] = useState(false);
  const { handleError } = useErrorHandler();

  const fullSummary = boardName ? `## ${boardName}\n\n${summary}` : summary;
  const hasResult = summary.length > 0;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      handleError(error, t('コピーに失敗しました'));
    }
  }, [handleError, fullSummary, t]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-primary h-5 w-5" />
            {t('AIサマリー')}
          </DialogTitle>
          <DialogDescription>{t('AIによりKPTのサマリーを生成します。')}</DialogDescription>
        </DialogHeader>

        {!hasResult && !isLoading ? (
          <>
            <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-400" />
              <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                <p>{t('Anthropic社のClaude APIにボードのデータを送信し、サマリーを生成します。')}</p>
                <p>
                  <Trans
                    i18nKey="Anthropic社の<consumerTerms>Consumer Terms</consumerTerms>および<commercialTerms>Commercial Terms</commercialTerms>によると、2025年1月時点においては、API経由で送信されたデータはAIの学習に使用されないと記載されています。"
                    ns="board"
                    components={{
                      consumerTerms: (
                        // eslint-disable-next-line jsx-a11y/anchor-has-content -- 翻訳テキストにリンクを挿入するため
                        <a
                          href="https://www.anthropic.com/legal/consumer-terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        />
                      ),
                      commercialTerms: (
                        // eslint-disable-next-line jsx-a11y/anchor-has-content -- 翻訳テキストにリンクを挿入するため
                        <a
                          href="https://www.anthropic.com/legal/commercial-terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        />
                      ),
                    }}
                  />
                </p>
                <p>{t('上記をご確認のうえ、AIサマリー機能をご利用ください。')}</p>
              </div>
            </div>
            <DialogFooter className="flex-none">
              <p className="text-muted-foreground mr-auto text-xs">{t('本日の残り利用回数: {{count}}回', { count: remainingCount })}</p>
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                {t('ui:キャンセル')}
              </Button>
              <Button size="sm" onClick={onGenerate}>
                {t('生成する')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="border-input min-h-0 flex-1 overflow-y-auto rounded-md border p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2">
                    <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                    <span className="text-muted-foreground text-sm">{t('サマリーを生成中...')}</span>
                  </div>
                </div>
              ) : (
                <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{fullSummary}</pre>
              )}
            </div>

            <DialogFooter className="flex-none flex-col gap-2 sm:flex-row sm:justify-between">
              <p className="text-muted-foreground text-xs">{t('本日の残り利用回数: {{count}}回', { count: remainingCount })}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} disabled={isLoading || !summary}>
                  {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                  {t('ui:コピー')}
                </Button>
                <Button size="sm" onClick={() => onOpenChange(false)}>
                  {t('ui:閉じる')}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
