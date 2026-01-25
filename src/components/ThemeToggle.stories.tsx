import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
};
