import { VALID_COLUMNS } from '@shared/constants';

import { ColumnSelector } from './ColumnSelector';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ColumnSelector> = {
  title: 'Forms/ColumnSelector',
  component: ColumnSelector,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const KeepSelected: Story = {
  name: 'Keep選択',
  args: {
    columns: VALID_COLUMNS,
    selectedColumn: 'keep',
    onColumnChange: () => {},
  },
};

export const ProblemSelected: Story = {
  name: 'Problem選択',
  args: {
    columns: VALID_COLUMNS,
    selectedColumn: 'problem',
    onColumnChange: () => {},
  },
};

export const TrySelected: Story = {
  name: 'Try選択',
  args: {
    columns: VALID_COLUMNS,
    selectedColumn: 'try',
    onColumnChange: () => {},
  },
};
