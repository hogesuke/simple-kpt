import { KPTColumnSkeleton } from './KPTColumnSkeleton';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof KPTColumnSkeleton> = {
  title: 'KPT/Board/KPTColumnSkeleton',
  component: KPTColumnSkeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
};

export const ThreeColumns: Story = {
  name: '3カラム',
  render: () => (
    <div className="flex gap-4">
      <KPTColumnSkeleton />
      <KPTColumnSkeleton />
      <KPTColumnSkeleton />
    </div>
  ),
};
