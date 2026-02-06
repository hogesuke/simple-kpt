import { cva } from 'class-variance-authority';

/**
 * ステータスバッジのスタイル定義
 */
export const statusBadge = cva('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    status: {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      in_progress: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
      done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      wont_fix: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
    },
  },
});
