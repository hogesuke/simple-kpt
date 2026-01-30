import { ReactElement } from 'react';

import { Skeleton } from '@/components/shadcn/skeleton';
import { TableCell, TableRow } from '@/components/shadcn/table';

/**
 * ボードテーブル行のスケルトンローダー
 */
export function BoardTableRowSkeleton(): ReactElement {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="w-12">
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  );
}
