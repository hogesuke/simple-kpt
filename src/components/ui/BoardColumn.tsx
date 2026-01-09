import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { columnDot, columnLabels } from '@/lib/column-styles';
import { cn } from '@/lib/utils';

import { SortableKPTCard } from './KPTCard';

import type { KptColumnType, KptItem } from '@/types/kpt';

const columnStyles =
  'p-4 flex-1 lg:basis-0 lg:min-w-0 rounded-md border border-slate-200 bg-slate-50 focus-visible:ring-1 focus-visible:ring-ring';

export interface BoardColumnProps extends React.HTMLAttributes<HTMLElement> {
  column: KptColumnType;
  items: KptItem[];
  selectedItemId?: string | null;
  onDeleteItem?: (id: string) => void;
  onCardClick?: (item: KptItem) => void;
  onTagClick?: (tag: string) => void;
  onMemberClick?: (memberId: string, memberName: string) => void;
}

export function BoardColumn({
  className,
  column,
  items,
  selectedItemId,
  onDeleteItem,
  onCardClick,
  onTagClick,
  onMemberClick,
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

  return (
    <section ref={setNodeRef} className={cn(columnStyles, 'relative flex flex-col overflow-hidden', className)} {...props}>
      <h2 className="flex flex-none items-center gap-2 p-2 text-lg font-semibold">
        <span className={columnDot({ column })} aria-hidden="true" />
        {columnLabels[column]}
      </h2>

      {/* 上部のグラデーションフェードインジケーター */}
      {canScrollUp && (
        <div className="pointer-events-none absolute top-13 right-0 left-0 z-10 h-8 bg-linear-to-b from-slate-50 to-transparent" />
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
              onTagClick={onTagClick}
              onMemberClick={onMemberClick}
            />
          ))}
        </ul>
      </SortableContext>

      {/* 下部のグラデーションフェードインジケーター */}
      {canScrollDown && (
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-linear-to-t from-slate-50 to-transparent" />
      )}
    </section>
  );
}
