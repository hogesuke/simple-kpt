import { ThumbsUp } from 'lucide-react';
import * as React from 'react';
import { ReactElement } from 'react';

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
}: VoteButtonProps): ReactElement {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onVote();
  };

  const ariaLabel = itemText
    ? hasVoted
      ? `「${itemText}」の投票を取り消す`
      : `「${itemText}」に投票する`
    : hasVoted
      ? '投票を取り消す'
      : '投票する';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full transition-colors',
            size === 'sm' ? 'py-1 pr-1.25 pl-2 text-xs' : 'px-2.5 py-1 text-sm',
            hasVoted ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            className
          )}
          aria-label={ariaLabel}
          aria-pressed={hasVoted}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          {voteCount > 0 && <span>{voteCount}</span>}
        </button>
      </TooltipTrigger>
      {voters.length > 0 && (
        <TooltipContent side="bottom" className="max-w-48">
          {voters.map((voter) => voter.nickname ?? '名前未設定').join(', ')}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
