import { ErrorAlert, ErrorAlertAction } from './ErrorAlert';
import { Button } from './shadcn/button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ErrorAlert> = {
  title: 'Forms/ErrorAlert',
  component: ErrorAlert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    message: 'エラーが発生しました',
  },
};

export const WithAction: Story = {
  name: 'アクション付き',
  args: {
    message: 'データの読み込みに失敗しました',
    children: (
      <ErrorAlertAction>
        <Button variant="outline" size="sm">
          再試行
        </Button>
      </ErrorAlertAction>
    ),
  },
};

export const LongMessage: Story = {
  name: '長文メッセージ',
  args: {
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
};
