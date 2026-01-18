import { ReactElement } from 'react';

import { columnButton, columnDot, columnLabels } from '@/lib/column-styles';

import type { KptColumnType } from '@/types/kpt';

interface ColumnSelectorProps {
  columns: KptColumnType[];
  selectedColumn: KptColumnType;
  onColumnChange: (column: KptColumnType) => void;
}

export function ColumnSelector({ columns, selectedColumn, onColumnChange }: ColumnSelectorProps): ReactElement {
  return (
    <div className="flex gap-2" role="group" aria-label="カラム選択">
      {columns.map((col) => (
        <button
          key={col}
          type="button"
          onClick={() => onColumnChange(col)}
          aria-pressed={selectedColumn === col}
          className={columnButton({ selected: selectedColumn === col })}
        >
          <span className={columnDot({ column: col })} aria-hidden="true" />
          {columnLabels[col]}
        </button>
      ))}
    </div>
  );
}
