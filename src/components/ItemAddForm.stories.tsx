import { ItemAddForm } from './ItemAddForm';

import type { KptColumnType } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ItemAddForm> = {
  title: 'Forms/ItemAddForm',
  component: ItemAddForm,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

export const Default: Story = {
  name: 'デフォルト',
  args: {
    columns,
    selectedColumn: 'keep',
    onColumnChange: () => {},
    onSubmit: (text) => console.log('Submit:', text),
  },
};
