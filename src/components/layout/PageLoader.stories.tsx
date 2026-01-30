import { PageLoader } from './PageLoader';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PageLoader> = {
  title: 'Layout/PageLoader',
  component: PageLoader,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex h-9 items-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
};
