import { LoadingButton } from './LoadingButton';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof LoadingButton> = {
  title: 'Forms/LoadingButton',
  component: LoadingButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    children: '更新',
  },
};

export const Loading: Story = {
  name: '読み込み中',
  args: {
    loading: true,
    children: '更新',
  },
};

export const Destructive: Story = {
  name: '削除',
  args: {
    variant: 'destructive',
    children: '削除',
  },
};

export const DestructiveLoading: Story = {
  name: '削除（読み込み中）',
  args: {
    variant: 'destructive',
    loading: true,
    children: '削除',
  },
};
