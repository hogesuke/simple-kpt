import { AlertTriangle } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { TryTableRowSkeleton } from '@/components/kpt/TryTableRowSkeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { isOverdue } from '@/lib/date-utils';
import { getStatusLabels } from '@/lib/kpt-helpers';
import { statusBadge } from '@/lib/status-styles';
import { TryItemWithBoard, TryStatus } from '@/types/kpt';

interface TryItemsTableProps {
  items: TryItemWithBoard[];
  isLoading?: boolean;
  onAssigneeClick?: (assigneeId: string, assigneeNickname: string) => void;
}

function StatusBadge({ status }: { status: TryStatus | null }): ReactElement {
  if (!status) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span className={statusBadge({ status })}>{getStatusLabels()[status]}</span>;
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '-';

  const date = new Date(dueDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function DueDateCell({ dueDate, status }: { dueDate: string | null; status: TryStatus | null }): ReactElement {
  const overdue = isOverdue(dueDate, status);
  const formattedDate = formatDueDate(dueDate);

  if (overdue) {
    return (
      <span className="text-alert inline-flex items-center gap-1 font-bold">
        <AlertTriangle className="h-4 w-4" />
        {formattedDate}
      </span>
    );
  }

  return <span>{formattedDate}</span>;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function TryItemsTable({ items, isLoading, onAssigneeClick }: TryItemsTableProps): ReactElement {
  const { t } = useTranslation('board');

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[240px]">{t('内容')}</TableHead>
            <TableHead className="w-[200px]">{t('board:ボード')}</TableHead>
            <TableHead className="w-[130px]">{t('ステータス')}</TableHead>
            <TableHead className="w-[130px]">{t('期日')}</TableHead>
            <TableHead className="w-[150px]">{t('担当者')}</TableHead>
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
        <p className="text-muted-foreground text-sm">{t('Tryアイテムがありません')}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[240px]">{t('内容')}</TableHead>
          <TableHead className="w-[200px]">{t('board:ボード')}</TableHead>
          <TableHead className="w-[130px]">{t('ステータス')}</TableHead>
          <TableHead className="w-[130px]">{t('期日')}</TableHead>
          <TableHead className="w-[150px]">{t('担当者')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Link to={`/boards/${item.boardId}?itemId=${item.id}`} className="rounded text-[15px] font-bold hover:underline">
                {truncateText(item.text, 50)}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground-subtle text-[13.5px]">
              <Link to={`/boards/${item.boardId}`} className="rounded hover:underline">
                {item.boardName || '-'}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={item.status} />
            </TableCell>
            <TableCell className="text-muted-foreground-subtle text-[13.5px]">
              <DueDateCell dueDate={item.dueDate} status={item.status} />
            </TableCell>
            <TableCell className="text-muted-foreground-subtle text-[13.5px]">
              {item.assigneeId && item.assigneeNickname ? (
                <button
                  type="button"
                  onClick={() => onAssigneeClick?.(item.assigneeId!, item.assigneeNickname!)}
                  className="hover:text-foreground rounded hover:underline"
                  aria-label={t('{{name}}でフィルター', { name: item.assigneeNickname })}
                >
                  {item.assigneeNickname}
                </button>
              ) : (
                <span>-</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
