import { VALID_COLUMNS } from '@shared/constants';

import { ItemAddForm } from './ItemAddForm';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ItemAddForm> = {
  title: 'Forms/ItemAddForm',
  component: ItemAddForm,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    columns: VALID_COLUMNS,
    selectedColumn: 'keep',
    onColumnChange: () => {},
    onSubmit: (text) => console.log('Submit:', text),
  },
};
