import { cn } from '@/lib/cn';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
  /** 入力量を示すプログレスバーを表示するか */
  showProgress?: boolean;
}

export function CharacterCounter({ current, max, className, showProgress = false }: CharacterCounterProps) {
  const isOverLimit = current > max;
  const ratio = max > 0 ? Math.min(current / max, 1) : 0;

  return (
    <span className={cn('inline-flex flex-col items-end gap-[5px]', className)}>
      <span className={cn('text-[13px]', isOverLimit ? 'text-destructive' : 'text-muted-foreground-subtle')}>
        {/* 現在の文字数のみ濃色・太字にする */}
        <span className={cn('font-bold', !isOverLimit && 'text-foreground')}>{current}</span> / {max}
      </span>
      {showProgress && (
        <span className="bg-border-subtle block h-1 w-24 overflow-hidden rounded-full">
          <span
            className={cn('block h-full rounded-full transition-[width] duration-200', isOverLimit ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${ratio * 100}%` }}
          />
        </span>
      )}
    </span>
  );
}
