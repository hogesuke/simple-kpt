import { Flame, ThumbsUp } from 'lucide-react';
import * as React from 'react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shadcn/tooltip';
import { cn } from '@/lib/cn';

import type { Voter } from '@/types/kpt';

interface VoteButtonProps {
  voteCount: number;
  hasVoted: boolean;
  voters: Voter[];
  onVote: () => void;
  size?: 'sm' | 'md';
  className?: string;
  itemText?: string;
  stopPropagation?: boolean;
  totalMemberCount?: number;
}

/**
 * 投票ボタン
 */
export function VoteButton({
  voteCount,
  hasVoted,
  voters,
  onVote,
  size = 'sm',
  className,
  itemText,
  stopPropagation = false,
  totalMemberCount,
}: VoteButtonProps): ReactElement {
  const { t } = useTranslation('board');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onVote();
  };

  // 全員が投票したかどうか
  const isAllVoted = totalMemberCount !== undefined && totalMemberCount > 0 && voters.length >= totalMemberCount;

  const ariaLabel = itemText
    ? hasVoted
      ? t('「{{text}}」の投票を取り消す', { text: itemText })
      : t('「{{text}}」に投票する', { text: itemText })
    : hasVoted
      ? t('投票を取り消す')
      : t('投票する');

  const Icon = isAllVoted ? Flame : ThumbsUp;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full transition-colors',
            size === 'sm' ? 'py-1 pr-1.25 pl-2 text-xs' : 'min-h-[30px] px-2.5 py-1 text-sm',
            isAllVoted
              ? 'border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20'
              : hasVoted
                ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/30 dark:hover:bg-primary/40 border'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent',
            className
          )}
          aria-label={ariaLabel}
          aria-pressed={hasVoted}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {voteCount > 0 && <span>{voteCount}</span>}
        </button>
      </TooltipTrigger>
      {voters.length > 0 && (
        <TooltipContent side="bottom" className="max-w-48">
          {voters.map((voter) => voter.nickname ?? t('名前未設定')).join(', ')}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
