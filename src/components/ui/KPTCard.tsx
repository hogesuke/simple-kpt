import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

import type { KptItem } from '@/types/kpt';

export const kptCardVariants = cva('rounded-md bg-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring');

export interface KPTCardProps {
  item: KptItem;
  className?: string;
}

export function KPTCard({ item, className }: KPTCardProps) {
  return (
    <div className={cn(kptCardVariants(), className)}>
      <p className="text-md p-4">{item.text}</p>
    </div>
  );
}

export interface SortableKPTCardProps extends React.LiHTMLAttributes<HTMLLIElement> {
  item: KptItem;
}

export function SortableKPTCard({ item, className, ...props }: SortableKPTCardProps) {
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
      <KPTCard item={item} />
    </li>
  );
}
