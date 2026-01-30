import { CharacterCounter } from './CharacterCounter';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CharacterCounter> = {
  title: 'Forms/CharacterCounter',
  component: CharacterCounter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    current: 120,
    max: 500,
  },
};

export const OverLimit: Story = {
  name: '上限超過',
  args: {
    current: 550,
    max: 500,
  },
};
