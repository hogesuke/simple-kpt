import { cva } from 'class-variance-authority';

/**
 * ステータスバッジのスタイル定義
 *
 * デザイン仕様: 12px / weight 700 / padding 3px 10px / 角丸6px
 */
export const statusBadge = cva('inline-flex items-center rounded-md px-2.5 py-[3px] text-xs font-bold', {
  variants: {
    status: {
      pending: 'bg-status-pending text-status-pending-foreground',
      in_progress: 'bg-status-progress text-status-progress-foreground',
      done: 'bg-status-done text-status-done-foreground',
      // デザインに指定がないため、無彩色のサーフェスで他と区別する
      wont_fix: 'bg-secondary text-muted-foreground',
    },
  },
});
