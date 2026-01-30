import { SkipLink } from './SkipLink';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof SkipLink> = {
  title: 'Layout/SkipLink',
  component: SkipLink,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'キーボードナビゲーション時にメインコンテンツへスキップするためのアクセシビリティ用リンク。通常は非表示で、フォーカス時のみ表示される。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  render: () => (
    <div>
      <p className="text-muted-foreground mb-4 text-sm">Tabキーを押すとSkipLinkが表示されます</p>
      <SkipLink />
      <div id="main-content" className="border-border mt-4 rounded border p-4">
        <p>メインコンテンツ</p>
      </div>
    </div>
  ),
};
