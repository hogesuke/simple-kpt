import { ArrowLeft } from 'lucide-react';
import { ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { SummaryButton } from '@/components/kpt/SummaryButton';
import { SummaryDialog } from '@/components/kpt/SummaryDialog';
import { Timer } from '@/components/kpt/Timer';
import { Skeleton } from '@/components/shadcn/skeleton';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { generateSummary } from '@/lib/kpt-api';
import { useBoardStore } from '@/stores/useBoardStore';
import { useHomeStore } from '@/stores/useHomeStore';

export function KPTBoardHeader(): ReactElement {
  const { t } = useTranslation('board');
  const { boardId } = useParams<{ boardId: string }>();
  const { handleError } = useErrorHandler();

  const boardName = useBoardStore((state) => state.currentBoard?.name ?? null);
  const isLoading = useBoardStore((state) => state.isLoading);
  const fromTry = useHomeStore((state) => state.activeTab) === 'try';

  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [remainingCount, setRemainingCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOpenSummaryDialog = useCallback(() => {
    setSummary('');
    setIsSummaryDialogOpen(true);
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    if (!boardId) return;

    setIsGenerating(true);

    try {
      const result = await generateSummary(boardId);
      setSummary(result.summary);
      setRemainingCount(result.remainingCount);
    } catch (error) {
      setIsSummaryDialogOpen(false);
      handleError(error, t('サマリーの生成に失敗しました'));
    } finally {
      setIsGenerating(false);
    }
  }, [boardId, handleError, t]);

  return (
    <header className="flex-none">
      <nav className="mb-2">
        <Link
          to="/boards"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded text-sm transition-colors hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {fromTry ? t('Tryリストに戻る') : t('ボードリストに戻る')}
        </Link>
      </nav>
      <div className="flex items-center justify-between gap-4">
        {isLoading ? <Skeleton className="h-8 w-48" /> : <h1 className="text-2xl font-semibold">{boardName ?? 'KPT Board'}</h1>}

        <div className="flex items-center gap-2">
          {/* AIサマリー生成ボタン */}
          {!isLoading && boardName && <SummaryButton onClick={handleOpenSummaryDialog} />}

          {/* タイマー */}
          {!isLoading && boardName && <Timer disabled={isLoading} />}
        </div>
      </div>

      <SummaryDialog
        isOpen={isSummaryDialogOpen}
        onOpenChange={setIsSummaryDialogOpen}
        onGenerate={handleGenerateSummary}
        summary={summary}
        remainingCount={remainingCount}
        isLoading={isGenerating}
        boardName={boardName ?? undefined}
      />
    </header>
  );
}
