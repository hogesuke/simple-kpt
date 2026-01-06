import { ReactElement } from 'react';

import { Skeleton } from '@/components/ui/shadcn/skeleton';

/**
 * ボードカードのスケルトンローダー
 */
export function BoardCardSkeleton(): ReactElement {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <Skeleton className="h-6 w-3/4" />
    </div>
  );
}
