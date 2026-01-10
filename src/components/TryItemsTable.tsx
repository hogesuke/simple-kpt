import { ReactElement } from 'react';
import { Link } from 'react-router';

import { TryTableRowSkeleton } from '@/components/TryTableRowSkeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadcn/table';
import { PROBLEM_STATUS_LABELS, TryItemWithBoard, TryStatus } from '@/types/kpt';

interface TryItemsTableProps {
  items: TryItemWithBoard[];
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: TryStatus | null }): ReactElement {
  if (!status) {
    return <span className="text-muted-foreground">-</span>;
  }

  const colorClasses: Record<TryStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
    wont_fix: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses[status]}`}>
      {PROBLEM_STATUS_LABELS[status]}
    </span>
  );
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '-';

  const date = new Date(dueDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function TryItemsTable({ items, isLoading }: TryItemsTableProps): ReactElement {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">内容</TableHead>
            <TableHead className="w-[20%]">ボード</TableHead>
            <TableHead className="w-[12%]">ステータス</TableHead>
            <TableHead className="w-[12%]">期日</TableHead>
            <TableHead className="w-[16%]">担当者</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(4)].map((_, i) => (
            <TryTableRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-muted-foreground text-sm">Tryアイテムがありません</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">内容</TableHead>
          <TableHead className="w-[20%]">ボード</TableHead>
          <TableHead className="w-[12%]">ステータス</TableHead>
          <TableHead className="w-[12%]">期日</TableHead>
          <TableHead className="w-[16%]">担当者</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <Link to={`/board/${item.boardId}`} className="hover:text-primary hover:underline">
                {truncateText(item.text, 50)}
              </Link>
            </TableCell>
            <TableCell>
              <Link to={`/board/${item.boardId}`} className="text-muted-foreground hover:text-primary hover:underline">
                {item.boardName || '-'}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={item.status} />
            </TableCell>
            <TableCell>{formatDueDate(item.dueDate)}</TableCell>
            <TableCell>{item.assigneeNickname || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
