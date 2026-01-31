import { User } from 'lucide-react';
import { memo, ReactElement } from 'react';

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
  const hasFilters = filterTag || filterMemberName;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">フィルター:</span>
      <div className="flex flex-wrap items-center gap-2">
        {filterTag && <FilterChip label={filterTag} onRemove={onRemoveTag} />}
        {filterMemberName && <FilterChip icon={<User className="h-3 w-3" />} label={filterMemberName} onRemove={onRemoveMember} />}
      </div>
    </div>
  );
});
