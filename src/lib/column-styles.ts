import { cva } from 'class-variance-authority';

import type { KptColumnType } from '@/types/kpt';

export const columnDot = cva('h-2 w-2 rounded-full', {
  variants: {
    column: {
      keep: '',
      problem: '',
      try: '',
    },
    selected: {
      true: '',
      false: 'bg-gray-400',
    },
  },
  compoundVariants: [
    { column: 'keep', selected: true, class: 'bg-lime-500' },
    { column: 'problem', selected: true, class: 'bg-red-400' },
    { column: 'try', selected: true, class: 'bg-blue-500' },
  ],
});

export const columnButton = cva('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors', {
  variants: {
    selected: {
      true: 'border-2',
      false:
        'border-2 border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300',
    },
    column: {
      keep: '',
      problem: '',
      try: '',
    },
  },
  compoundVariants: [
    // Keep - ライトモード
    { column: 'keep', selected: true, class: 'border-primary bg-primary/10 text-primary-dark' },
    // Keep - ダークモード（ネオングリーン）
    { column: 'keep', selected: true, class: 'dark:border-lime-400/60 dark:bg-lime-900/30 dark:text-lime-300' },
    // Problem - ライトモード
    { column: 'problem', selected: true, class: 'border-primary bg-primary/10 text-primary-dark' },
    // Problem - ダークモード（ネオンレッド）
    { column: 'problem', selected: true, class: 'dark:border-red-400/60 dark:bg-red-900/30 dark:text-red-300' },
    // Try - ライトモード
    { column: 'try', selected: true, class: 'border-primary bg-primary/10 text-primary-dark' },
    // Try - ダークモード（ネオンブルー）
    { column: 'try', selected: true, class: 'dark:border-sky-400/60 dark:bg-sky-900/30 dark:text-sky-300' },
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
