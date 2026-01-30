import { ReactElement } from 'react';

import { ColumnSelector } from '@/components/forms/ColumnSelector';
import { ItemInput } from '@/components/forms/ItemInput';

import type { KptColumnType } from '@/types/kpt';

interface ItemAddFormProps {
  columns: KptColumnType[];
  selectedColumn: KptColumnType;
  onColumnChange: (column: KptColumnType) => void;
  onSubmit: (text: string) => void | Promise<void>;
  disabled?: boolean;
}

export function ItemAddForm({ columns, selectedColumn, onColumnChange, onSubmit, disabled = false }: ItemAddFormProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <ColumnSelector columns={columns} selectedColumn={selectedColumn} onColumnChange={onColumnChange} />
      <ItemInput onSubmitText={onSubmit} disabled={disabled} placeholder="アイテムを追加..." />
    </div>
  );
}
