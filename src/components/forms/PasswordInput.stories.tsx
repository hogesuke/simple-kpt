import { PasswordInput } from './PasswordInput';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PasswordInput> = {
  title: 'Forms/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    placeholder: 'パスワードを入力',
  },
};

export const WithValue: Story = {
  name: '値あり',
  args: {
    defaultValue: 'password123',
    placeholder: 'パスワードを入力',
  },
};

export const WithError: Story = {
  name: 'エラー',
  args: {
    id: 'password',
    placeholder: 'パスワードを入力',
    error: 'パスワードは8文字以上で入力してください',
  },
};
