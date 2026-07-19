import { Filter, User } from 'lucide-react';
import { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterChip } from '@/components/kpt/FilterChip';

interface FilterBarProps {
  filterTag: string | null;
  filterMemberName: string | null;
  onRemoveTag: () => void;
  onRemoveMember: () => void;
}

/**
 * アクティブなフィルターを表示するバー
 */
export const FilterBar = memo(function FilterBar({
  filterTag,
  filterMemberName,
  onRemoveTag,
  onRemoveMember,
}: FilterBarProps): ReactElement | null {
  const { t } = useTranslation('board');
  const hasFilters = filterTag || filterMemberName;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-muted-foreground-subtle inline-flex items-center gap-1.5 text-[13px] font-bold">
        <Filter className="h-[15px] w-[15px]" aria-hidden="true" />
        {t('フィルター')}
      </span>
      {filterTag && <FilterChip label={filterTag} onRemove={onRemoveTag} />}
      {filterMemberName && <FilterChip icon={<User className="h-3.5 w-3.5" />} label={filterMemberName} onRemove={onRemoveMember} />}
      {filterTag && filterMemberName && (
        <button
          type="button"
          onClick={() => {
            onRemoveTag();
            onRemoveMember();
          }}
          className="text-muted-foreground-subtle hover:text-foreground rounded px-1.5 py-1.5 text-[12.5px] font-semibold transition-colors"
        >
          {t('すべて解除')}
        </button>
      )}
    </div>
  );
});
