import { FieldError } from './FieldError';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof FieldError> = {
  title: 'Forms/FieldError',
  component: FieldError,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    message: 'このフィールドは必須です',
  },
};

export const LongMessage: Story = {
  name: '長文メッセージ',
  args: {
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.',
  },
};

export const WithInput: Story = {
  name: '入力欄付き',
  render: () => (
    <div className="flex flex-col gap-1">
      <label htmlFor="email" className="text-sm font-medium">
        メールアドレス
      </label>
      <input
        id="email"
        type="email"
        className="border-input rounded-md border px-3 py-2"
        aria-invalid="true"
        aria-describedby="email-error"
      />
      <FieldError id="email-error" message="有効なメールアドレスを入力してください" />
    </div>
  ),
};
