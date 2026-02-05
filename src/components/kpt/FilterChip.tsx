import { X } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

interface FilterChipProps {
  icon?: ReactElement;
  label: string;
  onRemove: () => void;
}

export function FilterChip({ icon, label, onRemove }: FilterChipProps) {
  const { t } = useTranslation('board');

  return (
    <span className="border-primary/30 bg-primary/10 text-primary-dark inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm">
      {icon}
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-primary/20 ml-0.5 rounded-full p-0.5 transition-colors"
        aria-label={t('フィルターを解除')}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
