import { Check } from 'lucide-react';
import { ReactElement } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { PROBLEM_STATUS_LABELS, TryStatus } from '@/types/kpt';

interface StatusFilterProps {
  selectedStatuses: TryStatus[];
  onStatusChange: (statuses: TryStatus[]) => void;
}

const ALL_STATUSES: TryStatus[] = ['pending', 'in_progress', 'done', 'wont_fix'];

export function StatusFilter({ selectedStatuses, onStatusChange }: StatusFilterProps): ReactElement {
  const toggleStatus = (status: TryStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">フィルター:</span>
      {ALL_STATUSES.map((status) => {
        const isSelected = selectedStatuses.includes(status);
        return (
          <Button
            key={status}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleStatus(status)}
            className="gap-1"
          >
            {isSelected && <Check className="h-3 w-3" />}
            {PROBLEM_STATUS_LABELS[status]}
          </Button>
        );
      })}
    </div>
  );
}
