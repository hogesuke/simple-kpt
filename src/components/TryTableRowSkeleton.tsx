import { ReactElement } from 'react';

import { Skeleton } from '@/components/shadcn/skeleton';
import { TableCell, TableRow } from '@/components/shadcn/table';

/**
 * Tryテーブル行のスケルトンローダー
 */
export function TryTableRowSkeleton(): ReactElement {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-64" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20" />
      </TableCell>
    </TableRow>
  );
}
