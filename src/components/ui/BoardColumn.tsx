import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { KPTCard } from './KPTCard';

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
}

export function BoardColumn({ className, type, ...props }: BoardColumnProps) {
  return (
    <section className={cn(boardColumnVariants({ type, className }))} {...props}>
      <h2 className="p-2 text-lg font-semibold">{props.title}</h2>
      <ul>
        <KPTCard text="Sample card content" />
      </ul>
    </section>
  );
}
