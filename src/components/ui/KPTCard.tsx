import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import type { KptItem } from '@/types/kpt';

export const kptCardVariants = cva('rounded-md bg-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring');

export interface KPTCardProps {
  item: KptItem;
  isSelected?: boolean;
  className?: string;
  onDelete?: (id: string) => void | Promise<void>;
  onClick?: (item: KptItem) => void;
}

export function KPTCard({ item, isSelected = false, className, onDelete, onClick }: KPTCardProps) {
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onDelete?.(item.id);
  };

  const handleCardClick = () => {
    onClick?.(item);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article className={cn(kptCardVariants(), 'relative', className)} aria-label={`KPTカード: ${item.text}`}>
      <div
        role="button"
        tabIndex={onClick ? 0 : undefined}
        className={cn('p-4', onClick && 'cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
        onClick={onClick ? handleCardClick : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
        aria-expanded={onClick ? isSelected : undefined}
        aria-controls={onClick && isSelected ? `detail-panel-${item.id}` : undefined}
        aria-label={onClick ? `${item.text}の詳細を${isSelected ? '閉じる' : '開く'}` : undefined}
      >
        <p className="text-md pr-8 wrap-break-word">{item.text}</p>
        {item.authorNickname && <p className="text-muted-foreground mt-2 text-xs">{item.authorNickname}</p>}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="text-muted-foreground hover:bg-muted absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2"
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
}

export function SortableKPTCard({ item, isSelected, onDelete, onCardClick, className, ...props }: SortableKPTCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        // ドラッグ中に元の位置のカードを薄く表示する
        isDragging && 'opacity-30',
        className
      )}
      {...attributes}
      {...listeners}
      {...props}
    >
      <KPTCard item={item} isSelected={isSelected} onDelete={onDelete} onClick={onCardClick} />
    </li>
  );
}
