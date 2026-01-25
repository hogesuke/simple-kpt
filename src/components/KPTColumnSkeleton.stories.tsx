import type { Meta, StoryObj } from '@storybook/react-vite';

import { KPTColumnSkeleton } from './KPTColumnSkeleton';

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
