import { TooltipProvider } from '@/components/shadcn/tooltip';
import { MockBoardProvider, mockItems, mockMembers } from '@storybook-mocks/MockBoardProvider';

import { ItemDetailPanel } from './ItemDetailPanel';

import type { KptItem } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ItemDetailPanel> = {
  title: 'KPT/Card/ItemDetailPanel',
  component: ItemDetailPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <MockBoardProvider>
          <div className="relative h-screen">
            <Story />
          </div>
        </MockBoardProvider>
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const keepItem: KptItem = mockItems[0];

const problemItem: KptItem = {
  ...mockItems[1],
  column: 'problem',
  text: 'ドキュメントが不足している #ドキュメント #改善',
};

const tryItem: KptItem = {
  id: '3',
  boardId: 'board-1',
  column: 'try',
  text: 'タスク管理ツールを導入する #ツール',
  position: 0,
  authorId: 'user-1',
  authorNickname: 'user1',
  createdAt: new Date().toISOString(),
  voteCount: 3,
  hasVoted: true,
  voters: [
    { id: 'user-1', nickname: 'user1' },
    { id: 'user-2', nickname: 'user2' },
    { id: 'user-3', nickname: 'user3' },
  ],
  status: 'in_progress',
  assigneeId: 'user-1',
  assigneeNickname: 'user1',
  dueDate: '2026-02-01',
};

const longTextItem: KptItem = {
  ...keepItem,
  id: '7',
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim.',
};

export const Keep: Story = {
  args: {
    item: keepItem,
    onClose: () => console.log('Close'),
  },
};

export const Problem: Story = {
  args: {
    item: problemItem,
    onClose: () => console.log('Close'),
  },
};

export const Try: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <MockBoardProvider
          value={{
            members: mockMembers,
          }}
        >
          <div className="relative h-screen">
            <Story />
          </div>
        </MockBoardProvider>
      </TooltipProvider>
    ),
  ],
  args: {
    item: tryItem,
    onClose: () => console.log('Close'),
  },
};

export const LongText: Story = {
  name: '長いテキスト',
  args: {
    item: longTextItem,
    onClose: () => console.log('Close'),
  },
};
