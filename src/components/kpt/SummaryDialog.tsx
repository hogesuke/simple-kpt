import { Check, ChevronDown, Copy, Info, Sparkle } from 'lucide-react';
import { ReactElement, useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { cn } from '@/lib/cn';

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
 *
 * 確認 → 生成中 → 結果 の3ステートを持つ。
 * 生成中に出すアクションはキャンセルのみで、コピーは結果表示後にのみ表示する。
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
  const [isTermsOpen, setIsTermsOpen] = useState(false);
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

  const remainingLabel = (
    <p className="text-muted-foreground-subtle mr-auto text-[12.5px]">{t('本日の残り利用回数: {{count}}回', { count: remainingCount })}</p>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center gap-2.5">
            <Sparkle className="text-primary h-[22px] w-[22px]" />
            {t('AIサマリー')}
          </DialogTitle>
          <DialogDescription className="text-[13.5px]">{t('AIによりKPTのサマリーを生成します。')}</DialogDescription>
        </DialogHeader>

        {!hasResult && !isLoading && (
          <>
            {/* 確認ステート: 1行目は常時表示し、詳細はトグルで開閉する */}
            <div className="bg-surface-subtle border-border-subtle flex gap-3 rounded-[14px] border px-5 py-[18px]">
              <Info className="text-primary mt-px h-5 w-5 shrink-0" />
              <div className="text-muted-foreground flex-1 text-[13px] leading-[1.85]">
                <p>{t('Anthropic社のClaude APIにボードのデータを送信し、サマリーを生成します。')}</p>
                <button
                  type="button"
                  onClick={() => setIsTermsOpen((open) => !open)}
                  aria-expanded={isTermsOpen}
                  aria-controls="summary-terms-detail"
                  className="text-primary mt-2.5 inline-flex items-center gap-1.5 rounded text-[12.5px] font-bold"
                >
                  {t('データの取り扱いについて')}
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform duration-200', isTermsOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>
                {isTermsOpen && (
                  <div id="summary-terms-detail" className="border-border-subtle mt-3 border-t pt-3">
                    <p>
                      <Trans
                        i18nKey="Anthropic社の<commercialTerms>Commercial Terms</commercialTerms>によると、本機能提供時点においては、API経由で送信されたデータはAIの学習に使用されないと記載されています。"
                        ns="board"
                        components={{
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
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex-none">
              {remainingLabel}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('ui:キャンセル')}
              </Button>
              <Button onClick={onGenerate}>{t('生成する')}</Button>
            </DialogFooter>
          </>
        )}

        {isLoading && (
          <>
            {/* 生成中ステート: アクションはキャンセルのみ */}
            <div
              className="bg-secondary border-border-subtle text-muted-foreground flex items-center justify-center gap-3 rounded-[14px] border px-5 py-10 text-sm font-medium"
              role="status"
            >
              <span
                className="border-border border-t-primary h-[18px] w-[18px] animate-spin rounded-full border-[2.5px]"
                aria-hidden="true"
              />
              {t('サマリーを生成中...')}
            </div>
            <DialogFooter className="flex-none">
              {remainingLabel}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('ui:キャンセル')}
              </Button>
            </DialogFooter>
          </>
        )}

        {hasResult && !isLoading && (
          <>
            {/* 結果ステート */}
            <div className="border-border-subtle bg-secondary min-h-0 flex-1 overflow-y-auto rounded-[14px] border p-5">
              <pre className="font-sans text-[13.5px] leading-relaxed whitespace-pre-wrap">{fullSummary}</pre>
            </div>
            <DialogFooter className="flex-none">
              {remainingLabel}
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {t('ui:コピー')}
              </Button>
              <Button onClick={() => onOpenChange(false)}>{t('ui:閉じる')}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
