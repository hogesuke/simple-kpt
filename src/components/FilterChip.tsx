import { X } from 'lucide-react';
import { ReactElement } from 'react';

interface FilterChipProps {
  icon?: ReactElement;
  label: string;
  onRemove: () => void;
}

export function FilterChip({ icon, label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-sm text-primary">
      {icon}
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
        aria-label={`${label}フィルターを解除`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
