import { MemoryRouter } from 'react-router';

import { ErrorFallback } from './ErrorFallback';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ErrorFallback> = {
  title: 'Layout/ErrorFallback',
  component: ErrorFallback,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  render: () => (
    <div className="h-96">
      <ErrorFallback />
    </div>
  ),
};
