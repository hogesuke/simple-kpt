import { Sparkle } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

interface SummaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}

/**
 * AIサマリー生成ボタン
 */
export function SummaryButton({ onClick, disabled, title }: SummaryButtonProps): ReactElement {
  const { t } = useTranslation('board');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="border-input bg-card shadow-chip hover:bg-accent flex h-9 items-center gap-[7px] rounded-lg border px-4 text-[13.5px] font-bold transition-colors disabled:opacity-50"
    >
      <Sparkle className="h-4 w-4" />
      {t('AIサマリー')}
    </button>
  );
}
