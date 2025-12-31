import type { KptColumnType } from '@/types/kpt';

interface CategoryBadgeProps {
  type: KptColumnType;
}

export function CategoryBadge({ type }: CategoryBadgeProps) {
  const config = {
    keep: {
      label: 'Keep',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300',
    },
    problem: {
      label: 'Problem',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
    },
    try: {
      label: 'Try',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
    },
  };

  const { label, bgColor, textColor, borderColor } = config[type];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${bgColor} ${textColor} ${borderColor}`}
    >
      {label}
    </span>
  );
}