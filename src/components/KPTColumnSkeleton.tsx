import { ReactElement } from 'react';

import { Skeleton } from '@/components/shadcn/skeleton';

/**
 * KPTカードのスケルトンローダー
 */
function KPTCardSkeleton(): ReactElement {
  return (
    <div className="border-border bg-card rounded-md border p-4 shadow-sm">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}

/**
 * KPTカラムのスケルトンローダー
 */
export function KPTColumnSkeleton(): ReactElement {
  return (
    <div className="flex flex-1 flex-col rounded-md border border-slate-200 bg-slate-50 p-4 lg:min-w-0 lg:basis-0 dark:border-neutral-700 dark:bg-neutral-800">
      {/* ヘッダー */}
      <div className="flex flex-none items-center gap-2 p-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* カードリスト */}
      <div className="flex flex-1 flex-col gap-2 px-2 py-1">
        <KPTCardSkeleton />
        <KPTCardSkeleton />
        <KPTCardSkeleton />
      </div>
    </div>
  );
}
