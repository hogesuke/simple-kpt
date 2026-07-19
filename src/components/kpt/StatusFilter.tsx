import { Check } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { getStatusLabels } from '@/lib/kpt-helpers';
import { TryStatus } from '@/types/kpt';
import { VALID_TRY_STATUSES } from '@shared/constants';

interface StatusFilterProps {
  selectedStatuses: TryStatus[];
  onStatusChange: (statuses: TryStatus[]) => void;
}

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
      <span className="text-muted-foreground-subtle text-[13px] font-bold">{t('フィルター')}</span>
      {VALID_TRY_STATUSES.map((status) => {
        const isSelected = selectedStatuses.includes(status);
        return (
          // 選択中はチェックマーク、未選択は空の円を表示するピル（デザイン仕様）
          <button
            key={status}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => toggleStatus(status, !isSelected)}
            className={cn(
              'bg-card focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full px-[13px] py-1.5 text-[12.5px] transition-colors focus-visible:ring-2 focus-visible:ring-offset-1',
              isSelected
                ? 'border-primary/45 text-primary-dark shadow-chip border-[1.5px] font-bold'
                : 'border-border text-muted-foreground-subtle hover:text-foreground border font-semibold'
            )}
          >
            {isSelected ? (
              <Check className="size-[13px]" strokeWidth={3} aria-hidden="true" />
            ) : (
              <span className="border-icon/70 size-[13px] rounded-full border-[1.5px]" aria-hidden="true" />
            )}
            {getStatusLabels()[status]}
          </button>
        );
      })}
    </div>
  );
}
