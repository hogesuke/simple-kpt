import type { TryStatus } from '@/types/kpt';

/**
 * Tryアイテムの期日が過ぎているか判定する
 */
export function isOverdue(dueDate: string | null | undefined, status: TryStatus | null | undefined): boolean {
  if (!dueDate) return false;
  if (status === 'done' || status === 'wont_fix') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}
