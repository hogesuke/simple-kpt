import { cn } from '@/lib/cn';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const isOverLimit = current > max;

  return (
    <span className={cn('text-sm', isOverLimit ? 'text-destructive' : 'text-muted-foreground/90', className)}>
      {current} / {max}
    </span>
  );
}
