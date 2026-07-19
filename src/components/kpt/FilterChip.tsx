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
    <span className="border-primary/30 bg-card text-primary-dark shadow-chip inline-flex items-center gap-[7px] rounded-full border py-1.5 pr-2 pl-3 text-[12.5px] font-bold">
      {icon}
      <span>{label}</span>
      {/* ×ボタンは通常時は背景なし、hover時のみ淡い青背景 */}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-primary/15 inline-flex size-[17px] items-center justify-center rounded-full bg-transparent transition-colors"
        aria-label={t('フィルターを解除')}
      >
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </button>
    </span>
  );
}
