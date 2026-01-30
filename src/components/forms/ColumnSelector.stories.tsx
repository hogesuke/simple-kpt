import { useState } from 'react';

import { ColumnSelector } from './ColumnSelector';

import type { KptColumnType } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ColumnSelector> = {
  title: 'Forms/ColumnSelector',
  component: ColumnSelector,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

export const KeepSelected: Story = {
  name: 'Keep選択',
  args: {
    columns,
    selectedColumn: 'keep',
    onColumnChange: () => {},
  },
};

export const ProblemSelected: Story = {
  name: 'Problem選択',
  args: {
    columns,
    selectedColumn: 'problem',
    onColumnChange: () => {},
  },
};

export const TrySelected: Story = {
  name: 'Try選択',
  args: {
    columns,
    selectedColumn: 'try',
    onColumnChange: () => {},
  },
};
