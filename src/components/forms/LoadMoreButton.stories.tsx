import { LoadMoreButton } from './LoadMoreButton';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof LoadMoreButton> = {
  title: 'Forms/LoadMoreButton',
  component: LoadMoreButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    onClick: () => {},
    isLoading: false,
  },
};

export const Loading: Story = {
  name: '読み込み中',
  args: {
    onClick: () => {},
    isLoading: true,
  },
};
