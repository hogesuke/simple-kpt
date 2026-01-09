import { cva } from 'class-variance-authority';

import type { KptColumnType } from '@/types/kpt';

export const columnDot = cva('h-2 w-2 rounded-full', {
  variants: {
    column: {
      keep: 'bg-yellow-500',
      problem: 'bg-red-400',
      try: 'bg-blue-500',
    },
  },
});

export const columnButton = cva('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors border', {
  variants: {
    selected: {
      true: 'border-primary bg-primary/10 text-primary',
      false: 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export const columnLabels: Record<KptColumnType, string> = {
  keep: 'Keep',
  problem: 'Problem',
  try: 'Try',
};
