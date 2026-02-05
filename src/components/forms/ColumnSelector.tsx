import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { columnButton, columnDot, columnLabels } from '@/lib/column-styles';

import type { KptColumnType } from '@/types/kpt';

interface ColumnSelectorProps {
  columns: KptColumnType[];
  selectedColumn: KptColumnType;
  onColumnChange: (column: KptColumnType) => void;
}

export function ColumnSelector({ columns, selectedColumn, onColumnChange }: ColumnSelectorProps): ReactElement {
  const { t } = useTranslation('board');
  return (
    <RadioGroup
      value={selectedColumn}
      onValueChange={(value) => onColumnChange(value as KptColumnType)}
      className="flex gap-2"
      aria-label={t('カラム選択')}
    >
      {columns.map((col) => (
        <Label
          key={col}
          htmlFor={`column-${col}`}
          className={`has-focus-visible:ring-ring cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-offset-1 ${columnButton({ selected: selectedColumn === col, column: col })}`}
        >
          <RadioGroupItem value={col} id={`column-${col}`} className="sr-only" />
          <span className={columnDot({ column: col, selected: selectedColumn === col })} aria-hidden="true" />
          {columnLabels[col]}
        </Label>
      ))}
    </RadioGroup>
  );
}
