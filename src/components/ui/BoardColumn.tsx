import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { SortableKPTCard } from './KPTCard';

import type { KptColumnType, KptItem } from '@/types/kpt';

export const boardColumnVariants = cva(
  ['p-4', 'flex-1 lg:basis-0 lg:min-w-0', 'rounded-md', 'focus-visible:ring-1 focus-visible:ring-ring'],
  {
    variants: {
      type: {
        keep: 'bg-yellow-100',
        problem: 'bg-red-100',
        try: 'bg-blue-100',
      },
    },
    defaultVariants: {
      type: 'keep',
    },
  }
);

export const gradientVariants = cva('', {
  variants: {
    type: {
      keep: 'from-yellow-100',
      problem: 'from-red-100',
      try: 'from-blue-100',
    },
  },
  defaultVariants: {
    type: 'keep',
  },
});

export interface BoardColumnProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof boardColumnVariants> {
  title: string;
  column: KptColumnType;
  items: KptItem[];
  selectedItemId?: string | null;
  onDeleteItem?: (id: string) => void;
  onCardClick?: (item: KptItem) => void;
}

export function BoardColumn({
  className,
  type,
  title,
  column,
  items,
  selectedItemId,
  onDeleteItem,
  onCardClick,
  ...props
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: column });
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // マウント時とアイテム変更時にスクロール状態を確認する
  useEffect(() => {
    const checkScrollability = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const hasScrollableContent = container.scrollHeight > container.clientHeight;
      const scrollTop = container.scrollTop;
      const scrollBottom = container.scrollHeight - container.clientHeight - scrollTop;

      setCanScrollUp(hasScrollableContent && scrollTop > 1);
      setCanScrollDown(hasScrollableContent && scrollBottom > 1);
    };

    checkScrollability();

    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScrollability);

    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollability);
      resizeObserver.disconnect();
    };
  }, [items]);

  const gradientClass = gradientVariants({ type });

  return (
    <section ref={setNodeRef} className={cn(boardColumnVariants({ type, className }), 'relative flex flex-col overflow-hidden')} {...props}>
      <h2 className="flex-none p-2 text-lg font-semibold">{title}</h2>

      {/* 上部のグラデーションフェードインジケーター */}
      {canScrollUp && (
        <div
          className={cn('pointer-events-none absolute top-13 right-0 left-0 z-10 h-8 bg-linear-to-b to-transparent', gradientClass)}
        />
      )}

      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul ref={scrollContainerRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-1">
          {items.map((item) => (
            <SortableKPTCard
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onDelete={onDeleteItem}
              onCardClick={onCardClick}
            />
          ))}
        </ul>
      </SortableContext>

      {/* 下部のグラデーションフェードインジケーター */}
      {canScrollDown && (
        <div
          className={cn('pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-linear-to-t to-transparent', gradientClass)}
        />
      )}
    </section>
  );
}
