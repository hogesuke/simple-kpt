import { StatusFilter } from './StatusFilter';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof StatusFilter> = {
  title: 'KPT/Filter/StatusFilter',
  component: StatusFilter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoneSelected: Story = {
  name: '未選択',
  args: {
    selectedStatuses: [],
    onStatusChange: () => {},
  },
};

export const MultipleSelected: Story = {
  name: '複数選択',
  args: {
    selectedStatuses: ['pending', 'in_progress'],
    onStatusChange: () => {},
  },
};
