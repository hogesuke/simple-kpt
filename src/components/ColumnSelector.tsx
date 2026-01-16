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
    <div className="flex gap-2">
      {columns.map((col) => (
        <button key={col} type="button" onClick={() => onColumnChange(col)} className={columnButton({ selected: selectedColumn === col })}>
          <span className={columnDot({ column: col })} />
          {columnLabels[col]}
        </button>
      ))}
    </div>
  );
}
