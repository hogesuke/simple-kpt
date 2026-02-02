import { cva } from 'class-variance-authority';

import type { KptColumnType } from '@/types/kpt';

export const columnDot = cva('h-2 w-2 rounded-full', {
  variants: {
    column: {
      keep: 'bg-lime-500',
      problem: 'bg-red-400',
      try: 'bg-blue-500',
    },
  },
});

export const columnButton = cva('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors border', {
  variants: {
    selected: {
      true: 'border-primary bg-primary/10 text-primary-dark dark:bg-white/10',
      false:
        'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300',
    },
    column: {
      keep: '',
      problem: '',
      try: '',
    },
  },
  compoundVariants: [
    { selected: true, column: 'keep', class: 'dark:border-lime-500' },
    { selected: true, column: 'problem', class: 'dark:border-red-400' },
    { selected: true, column: 'try', class: 'dark:border-blue-500' },
  ],
  defaultVariants: {
    selected: false,
  },
});

export const columnLabels: Record<KptColumnType, string> = {
  keep: 'Keep',
  problem: 'Problem',
  try: 'Try',
};
