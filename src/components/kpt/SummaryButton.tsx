import { Bot } from 'lucide-react';
import { ReactElement } from 'react';

interface SummaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}

/**
 * AIサマリー生成ボタン
 */
export function SummaryButton({ onClick, disabled, title }: SummaryButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="border-input hover:bg-muted flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors disabled:opacity-50"
    >
      <Bot className="h-4 w-4" />
      AIサマリー
    </button>
  );
}
