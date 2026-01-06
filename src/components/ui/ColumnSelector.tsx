import { ReactElement } from 'react';

import { columnDotColors, columnLabels } from '@/lib/column-styles';

import type { KptColumnType } from '@/types/kpt';

interface ColumnSelectorProps {
  columns: KptColumnType[];
  selectedColumn: KptColumnType;
  onColumnChange: (column: KptColumnType) => void;
}

export function ColumnSelector({
  columns,
  selectedColumn,
  onColumnChange,
}: ColumnSelectorProps): ReactElement {
  return (
    <div className="flex gap-2">
      {columns.map((col) => (
        <button
          key={col}
          type="button"
          onClick={() => onColumnChange(col)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
            selectedColumn === col
              ? 'border border-primary bg-primary/10 text-primary'
              : 'border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${columnDotColors[col]}`} />
          {columnLabels[col]}
        </button>
      ))}
    </div>
  );
}
