import { cva } from 'class-variance-authority';

import type { KptColumnType } from '@/types/kpt';

// ドットは選択状態に関わらずカテゴリ色で表示する（デザイン仕様）
export const columnDot = cva('rounded-full', {
  variants: {
    column: {
      keep: 'bg-kpt-keep',
      problem: 'bg-kpt-problem',
      try: 'bg-kpt-try',
    },
    size: {
      sm: 'size-[7px]',
      md: 'size-[9px]',
      lg: 'size-2.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// 選択時はカテゴリ色のボーダー1.5px+テキスト、非選択は淡いボーダー+補足テキスト色のピル
export const columnButton = cva('inline-flex items-center gap-1.5 rounded-full bg-card px-[13px] py-[5px] text-[13px] transition-colors', {
  variants: {
    selected: {
      true: 'border-[1.5px] font-bold shadow-chip',
      false: 'border border-border text-muted-foreground-subtle font-medium hover:border-input hover:text-foreground',
    },
    column: {
      keep: '',
      problem: '',
      try: '',
    },
  },
  compoundVariants: [
    { column: 'keep', selected: true, class: 'border-kpt-keep/60 text-kpt-keep-strong' },
    { column: 'problem', selected: true, class: 'border-kpt-problem/60 text-kpt-problem-strong' },
    { column: 'try', selected: true, class: 'border-kpt-try/60 text-kpt-try-strong' },
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
