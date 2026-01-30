import { TooltipProvider } from '@/components/shadcn/tooltip';

import { KPTCard } from './KPTCard';

import type { KptItem } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof KPTCard> = {
  title: 'KPT/Card/KPTCard',
  component: KPTCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseItem: KptItem = {
  id: '1',
  boardId: 'board-1',
  column: 'keep',
  text: '障害発生時の対応フローが確立されている',
  position: 0,
  authorId: 'user-1',
  authorNickname: 'user1',
  createdAt: new Date().toISOString(),
  voteCount: 0,
  hasVoted: false,
  voters: [],
};

export const Default: Story = {
  name: 'デフォルト',
  args: {
    item: baseItem,
    onVote: () => {},
    totalMemberCount: 5,
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const WithHashtag: Story = {
  name: 'ハッシュタグ付き',
  args: {
    item: {
      ...baseItem,
      text: '#ミーティング を毎週実施している #改善',
    },
    onTagClick: (tag) => console.log('Tag clicked:', tag),
    onVote: () => {},
    totalMemberCount: 5,
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const WithVotes: Story = {
  name: '投票あり',
  args: {
    item: {
      ...baseItem,
      voteCount: 3,
      hasVoted: true,
      voters: [
        { id: '1', nickname: 'user1' },
        { id: '2', nickname: 'user2' },
        { id: '3', nickname: 'user3' },
      ],
    },
    onVote: () => {},
    totalMemberCount: 5,
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const AllVoted: Story = {
  name: '全員投票',
  args: {
    item: {
      ...baseItem,
      voteCount: 3,
      hasVoted: true,
      voters: [
        { id: '1', nickname: 'user1' },
        { id: '2', nickname: 'user2' },
        { id: '3', nickname: 'user3' },
      ],
    },
    onVote: () => {},
    totalMemberCount: 3,
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const TryWithStatus: Story = {
  name: 'Try（ステータス付き）',
  args: {
    item: {
      ...baseItem,
      column: 'try',
      text: 'コードレビューの時間を短縮する',
      status: 'in_progress',
      assigneeNickname: 'user2',
      dueDate: '2026-02-01',
    },
    onVote: () => {},
    totalMemberCount: 5,
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const TryOverdue: Story = {
  name: 'Try（期限切れ）',
  args: {
    item: {
      ...baseItem,
      column: 'try',
      text: '期限切れのタスク',
      status: 'pending',
      assigneeNickname: 'user2',
      dueDate: '2025-01-01',
    },
    onVote: () => {},
    totalMemberCount: 5,
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const LongText: Story = {
  name: '長文テキスト',
  args: {
    item: {
      ...baseItem,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim.',
    },
    onVote: () => {},
    totalMemberCount: 5,
    onDelete: (id) => console.log('Delete:', id),
  },
};
