import { ItemInput } from './ItemInput';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ItemInput> = {
  title: 'Forms/ItemInput',
  component: ItemInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    placeholder: 'アイテムを入力',
    onSubmitText: (text) => console.log('Submitted:', text),
  },
};
