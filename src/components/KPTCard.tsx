import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import { AlertTriangle, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/cn';
import { isOverdue } from '@/lib/date-utils';

import { VoteButton } from './VoteButton';

import type { KptItem, TryStatus } from '@/types/kpt';

const statusBadge = cva('rounded-full px-2 py-0.5', {
  variants: {
    status: {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      done: 'bg-green-100 text-green-700',
      wont_fix: 'bg-gray-100 text-gray-600',
    },
  },
});

const STATUS_LABELS: Record<TryStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  done: '完了',
  wont_fix: '対応不要',
};

const cardStyles = 'rounded-md border border-border bg-card shadow-sm';

// ハッシュタグを検出する正規表現（日本語、英数字、アンダースコアを許容している）
const HASHTAG_PATTERN = '#[\\w\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FFF]+';

interface TextPart {
  text: string;
  isHashtag: boolean;
}

/**
 * テキストをパースしてハッシュタグとそれ以外に分割する
 */
function parseTextWithHashtags(text: string): TextPart[] {
  const regex = new RegExp(HASHTAG_PATTERN, 'g');
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchText = match[0];

    // テキストの先頭、または半角・全角スペースの後にある場合のみハッシュタグとして判別する
    const isAtStart = matchStart === 0;
    const isPrecededBySpace = matchStart > 0 && /[\s\u3000]/.test(text[matchStart - 1]);

    if (isAtStart || isPrecededBySpace) {
      // ハッシュタグの前のテキストを追加
      if (matchStart > lastIndex) {
        parts.push({ text: text.slice(lastIndex, matchStart), isHashtag: false });
      }
      // ハッシュタグを追加
      parts.push({ text: matchText, isHashtag: true });
      lastIndex = matchStart + matchText.length;
    }
  }

  // 残りのテキストを追加
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isHashtag: false });
  }

  return parts.length > 0 ? parts : [{ text, isHashtag: false }];
}

interface TextWithHashtagsProps {
  text: string;
  onTagClick?: (tag: string) => void;
}

/**
 * テキスト内のハッシュタグをハイライト表示するコンポーネント
 */
export function TextWithHashtags({ text, onTagClick }: TextWithHashtagsProps) {
  const parts = parseTextWithHashtags(text);

  return (
    <>
      {parts.map((part, index) => {
        if (part.isHashtag) {
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(part.text);
              }}
              className="text-primary/90 hover:text-primary rounded text-[0.96em] hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              {part.text}
            </button>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </>
  );
}

export interface KPTCardProps {
  item: KptItem;
  isSelected?: boolean;
  className?: string;
  onDelete?: (id: string) => void | Promise<void>;
  onClick?: (item: KptItem) => void;
  onTagClick?: (tag: string) => void;
  onMemberClick?: (memberId: string, memberName: string) => void;
  onVote?: (itemId: string) => void | Promise<void>;
  totalMemberCount?: number;
}

export function KPTCard({
  item,
  isSelected = false,
  className,
  onDelete,
  onClick,
  onTagClick,
  onMemberClick,
  onVote,
  totalMemberCount,
}: KPTCardProps) {
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onDelete?.(item.id);
  };

  const handleCardClick = () => {
    onClick?.(item);
  };

  const handleVoteClick = () => {
    void onVote?.(item.id);
  };

  return (
    <article className={cn(cardStyles, 'relative', className)} aria-label={`KPTカード: ${item.text}`}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- キーボードアクセシビリティは別途「詳細を開く」ボタンで提供している */}
      <div
        className={cn('p-4', onClick && 'cursor-pointer transition-shadow hover:shadow-md')}
        onClick={onClick ? handleCardClick : undefined}
      >
        <p className="text-md pr-8 wrap-break-word">
          <TextWithHashtags text={item.text} onTagClick={onTagClick} />
        </p>
        {item.authorNickname && (
          <p className="mt-2 text-xs">
            {onMemberClick && item.authorId ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMemberClick(item.authorId!, item.authorNickname!);
                }}
                className="text-muted-foreground hover:text-foreground rounded hover:underline"
                aria-label={`${item.authorNickname}でフィルター`}
              >
                {item.authorNickname}
              </button>
            ) : (
              <span className="text-muted-foreground">{item.authorNickname}</span>
            )}
          </p>
        )}
        {/* Try専用フィールドの表示 */}
        {item.column === 'try' && (item.status || item.assigneeNickname || item.dueDate) && (
          <div className="border-border mt-3 flex flex-wrap items-center gap-3 border-t pt-3 text-sm">
            {item.status && <span className={cn(statusBadge({ status: item.status }), 'text-xs')}>{STATUS_LABELS[item.status]}</span>}
            {item.assigneeNickname && <span className="text-muted-foreground">担当: {item.assigneeNickname}</span>}
            {item.dueDate && (
              <span
                className={isOverdue(item.dueDate, item.status) ? 'inline-flex items-center gap-1 text-red-600' : 'text-muted-foreground'}
              >
                {isOverdue(item.dueDate, item.status) && <AlertTriangle className="h-3.5 w-3.5" />}
                期日: {item.dueDate.replace(/-/g, '/')}
              </span>
            )}
          </div>
        )}
      </div>
      {/* 投票ボタン */}
      {onVote && (
        <VoteButton
          voteCount={item.voteCount ?? 0}
          hasVoted={item.hasVoted ?? false}
          voters={item.voters ?? []}
          onVote={handleVoteClick}
          size="sm"
          className="absolute right-2 bottom-3"
          itemText={item.text}
          stopPropagation
          totalMemberCount={totalMemberCount}
        />
      )}
      {onClick && (
        <button
          type="button"
          onClick={handleCardClick}
          className="bg-background text-foreground focus:ring-ring sr-only rounded px-2 py-1 text-xs shadow focus:not-sr-only focus:absolute focus:right-2 focus:bottom-2 focus:ring-2 focus:outline-none"
          aria-expanded={isSelected}
        >
          詳細を開く
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="text-muted-foreground hover:bg-muted absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full"
          aria-label={`「${item.text}」カードを削除`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </article>
  );
}

export interface SortableKPTCardProps extends React.LiHTMLAttributes<HTMLLIElement> {
  item: KptItem;
  isSelected?: boolean;
  onDelete?: (id: string) => void | Promise<void>;
  onCardClick?: (item: KptItem) => void;
  onTagClick?: (tag: string) => void;
  onMemberClick?: (memberId: string, memberName: string) => void;
  onVote?: (itemId: string) => void | Promise<void>;
  totalMemberCount?: number;
}

export function SortableKPTCard({
  item,
  isSelected,
  onDelete,
  onCardClick,
  onTagClick,
  onMemberClick,
  onVote,
  totalMemberCount,
  className,
  ...props
}: SortableKPTCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  // role="button"は<li>要素では許可されていないため除外する
  const { role: _role, ...restAttributes } = attributes;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    // <li>要素自体にフォーカスがある場合のみDetailPanelを開く（子要素のボタン等は除外）
    if (e.key === 'Enter' && onCardClick && e.target === e.currentTarget) {
      e.preventDefault();
      onCardClick(item);
    }

    // dnd-kitのlistenersにもキーイベントを伝播する
    listeners?.onKeyDown?.(e as unknown as KeyboardEvent);
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dnd-kitのドラッグ&ドロップとキーボードナビゲーションに必要なため許容する
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        // ドラッグ中に元の位置のカードを薄く表示する
        isDragging && 'opacity-30',
        'focus-visible:ring-ring focus-visible:ring-offset-background rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      {...restAttributes}
      {...listeners}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <KPTCard
        item={item}
        isSelected={isSelected}
        onDelete={onDelete}
        onClick={onCardClick}
        onTagClick={onTagClick}
        onMemberClick={onMemberClick}
        onVote={onVote}
        totalMemberCount={totalMemberCount}
      />
    </li>
  );
}
