import { DndContext } from '@dnd-kit/core';

import { TooltipProvider } from '@/components/shadcn/tooltip';

import { BoardColumn } from './BoardColumn';

import type { KptItem } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof BoardColumn> = {
  title: 'KPT/Board/BoardColumn',
  component: BoardColumn,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <DndContext>
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      </DndContext>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseItems: KptItem[] = [
  {
    id: '1',
    boardId: 'board-1',
    column: 'keep',
    text: '障害発生時の対応フローが確立されている',
    position: 0,
    authorId: 'user-1',
    authorNickname: 'user1',
    createdAt: new Date().toISOString(),
    voteCount: 2,
    hasVoted: true,
    voters: [
      { id: '1', nickname: 'user1' },
      { id: '2', nickname: 'user2' },
    ],
  },
  {
    id: '2',
    boardId: 'board-1',
    column: 'keep',
    text: 'テストカバレッジ80%以上を維持している',
    position: 1,
    authorId: 'user-2',
    authorNickname: 'user2',
    createdAt: new Date().toISOString(),
    voteCount: 1,
    hasVoted: false,
    voters: [{ id: '1', nickname: 'user1' }],
  },
  {
    id: '3',
    boardId: 'board-1',
    column: 'keep',
    text: 'ドキュメントを充実させている #ドキュメント',
    position: 2,
    authorId: 'user-1',
    authorNickname: 'user1',
    createdAt: new Date().toISOString(),
    voteCount: 0,
    hasVoted: false,
    voters: [],
  },
];

export const Keep: Story = {
  args: {
    column: 'keep',
    items: baseItems,
    onDeleteItem: (id) => console.log('Delete:', id),
    onCardClick: (item) => console.log('Click:', item),
    onVote: (id) => console.log('Vote:', id),
    totalMemberCount: 5,
  },
};

export const Problem: Story = {
  args: {
    column: 'problem',
    items: baseItems.map((item) => ({ ...item, column: 'problem' as const })),
    onDeleteItem: (id) => console.log('Delete:', id),
    onCardClick: (item) => console.log('Click:', item),
    onVote: (id) => console.log('Vote:', id),
    totalMemberCount: 5,
  },
};

export const Try: Story = {
  args: {
    column: 'try',
    items: [
      {
        ...baseItems[0],
        column: 'try' as const,
        text: 'タスク管理ツールを導入する',
        status: 'in_progress' as const,
        assigneeNickname: 'user1',
        dueDate: '2026-02-01',
      },
      {
        ...baseItems[1],
        column: 'try' as const,
        text: 'ペアプログラミングを試す',
        status: 'pending' as const,
      },
    ],
    onDeleteItem: (id) => console.log('Delete:', id),
    onCardClick: (item) => console.log('Click:', item),
    onVote: (id) => console.log('Vote:', id),
    totalMemberCount: 5,
  },
};
