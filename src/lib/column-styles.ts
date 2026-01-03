import type { KptColumnType } from '@/types/kpt';

export const columnDotColors: Record<KptColumnType, string> = {
  keep: 'bg-yellow-500',
  problem: 'bg-red-400',
  try: 'bg-blue-500',
};

export const columnLabels: Record<KptColumnType, string> = {
  keep: 'Keep',
  problem: 'Problem',
  try: 'Try',
};
