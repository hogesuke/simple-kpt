import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/shadcn/checkbox';
import { TryStatus } from '@/types/kpt';

interface StatusFilterProps {
  selectedStatuses: TryStatus[];
  onStatusChange: (statuses: TryStatus[]) => void;
}

const ALL_STATUSES: TryStatus[] = ['pending', 'in_progress', 'done', 'wont_fix'];

const STATUS_KEYS: Record<TryStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  done: '完了',
  wont_fix: '対応不要',
};

export function StatusFilter({ selectedStatuses, onStatusChange }: StatusFilterProps): ReactElement {
  const { t } = useTranslation('board');

  const toggleStatus = (status: TryStatus, checked: boolean) => {
    if (checked) {
      onStatusChange([...selectedStatuses, status]);
    } else {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('ステータスフィルター')}>
      <span className="text-muted-foreground text-sm">{t('フィルター:')}</span>
      {ALL_STATUSES.map((status) => {
        const isSelected = selectedStatuses.includes(status);
        return (
          <label
            key={status}
            className={`flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
              isSelected ? 'border-primary/30 bg-primary/10 text-primary-dark' : 'border-border bg-background hover:bg-muted/50'
            }`}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => toggleStatus(status, checked === true)}
              className="data-[state=unchecked]:border-muted-foreground/50 h-4 w-4 rounded-sm shadow-none"
            />
            <span className="select-none">{t(STATUS_KEYS[status])}</span>
          </label>
        );
      })}
    </div>
  );
}
