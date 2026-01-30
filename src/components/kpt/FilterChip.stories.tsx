import { Hash, User } from 'lucide-react';

import { FilterChip } from './FilterChip';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof FilterChip> = {
  title: 'KPT/Filter/FilterChip',
  component: FilterChip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    label: 'フィルター',
    onRemove: () => {},
  },
};

export const WithHashtagIcon: Story = {
  name: 'ハッシュタグ',
  args: {
    icon: <Hash className="h-3 w-3" />,
    label: 'タグ名',
    onRemove: () => {},
  },
};

export const WithUserIcon: Story = {
  name: 'ユーザー',
  args: {
    icon: <User className="h-3 w-3" />,
    label: 'user1',
    onRemove: () => {},
  },
};
