import { FilterBar } from './FilterBar';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof FilterBar> = {
  title: 'KPT/Filter/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TagOnly: Story = {
  name: 'タグのみ',
  args: {
    filterTag: '#改善',
    filterMemberName: null,
    onRemoveTag: () => {},
    onRemoveMember: () => {},
  },
};

export const MemberOnly: Story = {
  name: 'メンバーのみ',
  args: {
    filterTag: null,
    filterMemberName: 'user1',
    onRemoveTag: () => {},
    onRemoveMember: () => {},
  },
};

export const Both: Story = {
  name: '両方',
  args: {
    filterTag: '#ミーティング',
    filterMemberName: 'user2',
    onRemoveTag: () => {},
    onRemoveMember: () => {},
  },
};

export const NoFilter: Story = {
  name: 'フィルターなし',
  args: {
    filterTag: null,
    filterMemberName: null,
    onRemoveTag: () => {},
    onRemoveMember: () => {},
  },
};
