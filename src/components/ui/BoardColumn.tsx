import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const boardColumnVariants = cva(['w-128 flex-initial', 'rounded-md', 'focus-visible:ring-1 focus-visible:ring-ring'], {
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
});

export interface BoardColumnProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof boardColumnVariants> {
  title: string;
}

export function BoardColumn({ className, type, ...props }: BoardColumnProps) {
  return (
    <div className={cn(boardColumnVariants({ type, className }))} {...props}>
      <h2 className="p-4 text-lg font-semibold">{props.title}</h2>
    </div>
  );
}
