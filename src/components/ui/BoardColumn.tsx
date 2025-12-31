import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

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

export interface BoardColumnProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof boardColumnVariants> {
  title: string;
  column: KptColumnType;
  items: KptItem[];
  selectedItemId?: string | null;
  onDeleteItem?: (id: string) => void;
  onCardClick?: (item: KptItem) => void;
}

export function BoardColumn({ className, type, title, column, items, selectedItemId, onDeleteItem, onCardClick, ...props }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: column });

  return (
    <section ref={setNodeRef} className={cn(boardColumnVariants({ type, className }))} {...props}>
      <h2 className="p-2 text-lg font-semibold">{title}</h2>

      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
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
    </section>
  );
}
