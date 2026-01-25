import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormErrorAlert } from './FormErrorAlert';

const meta: Meta<typeof FormErrorAlert> = {
  title: 'Forms/FormErrorAlert',
  component: FormErrorAlert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    children: 'ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。',
  },
};

export const ShortMessage: Story = {
  name: '短文メッセージ',
  args: {
    children: 'エラーが発生しました',
  },
};

export const WithLink: Story = {
  name: 'リンク付き',
  args: {
    children: (
      <>
        アカウントが見つかりません。
        <a href="#" className="ml-1 underline">
          新規登録はこちら
        </a>
      </>
    ),
  },
};
