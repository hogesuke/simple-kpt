import { MockBoardProvider } from '@storybook-mocks/MockBoardProvider';

import { Timer } from './Timer';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Timer> = {
  title: 'KPT/Timer',
  component: Timer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockBoardProvider>
        <Story />
      </MockBoardProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {},
};

export const Disabled: Story = {
  name: '無効状態',
  args: {
    disabled: true,
  },
};

export const Running: Story = {
  name: 'タイマー動作中',
  decorators: [
    (Story) => (
      <MockBoardProvider
        value={{
          timerState: {
            startedAt: new Date().toISOString(),
            durationSeconds: 180,
            hideOthersCards: true,
            startedBy: 'user-1',
          },
        }}
      >
        <Story />
      </MockBoardProvider>
    ),
  ],
  args: {},
};
