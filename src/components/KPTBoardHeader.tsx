import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

import { Skeleton } from '@/components/shadcn/skeleton';
import { Timer } from '@/components/Timer';
import { useBoardStore } from '@/stores/useBoardStore';
import { useHomeStore } from '@/stores/useHomeStore';

import type { ReactElement } from 'react';

export function KPTBoardHeader(): ReactElement {
  const boardName = useBoardStore((state) => state.currentBoard?.name ?? null);
  const isLoading = useBoardStore((state) => state.isLoading);
  const fromTry = useHomeStore((state) => state.activeTab) === 'try';

  return (
    <header className="flex-none">
      <nav className="mb-2">
        <Link
          to="/boards"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded text-sm transition-colors hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {fromTry ? 'Tryリストに戻る' : 'ボードリストに戻る'}
        </Link>
      </nav>
      <div className="flex items-center justify-between gap-4">
        {isLoading ? <Skeleton className="h-8 w-48" /> : <h1 className="text-2xl font-semibold">{boardName ?? 'KPT Board'}</h1>}

        {/* タイマー */}
        {!isLoading && boardName && <Timer disabled={isLoading} />}
      </div>
    </header>
  );
}
