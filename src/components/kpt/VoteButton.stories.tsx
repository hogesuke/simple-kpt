import { TooltipProvider } from '@/components/shadcn/tooltip';

import { VoteButton } from './VoteButton';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof VoteButton> = {
  title: 'KPT/Card/VoteButton',
  component: VoteButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    voteCount: 0,
    hasVoted: false,
    voters: [],
    onVote: () => {},
  },
};

export const HasVoted: Story = {
  name: '投票済み',
  args: {
    voteCount: 1,
    hasVoted: true,
    voters: [{ id: '1', nickname: 'user1' }],
    onVote: () => {},
  },
};

export const AllVoted: Story = {
  name: '全員投票',
  args: {
    voteCount: 3,
    hasVoted: true,
    voters: [
      { id: '1', nickname: 'user1' },
      { id: '2', nickname: 'user2' },
      { id: '3', nickname: 'user3' },
    ],
    totalMemberCount: 3,
    onVote: () => {},
  },
};

export const SizeSmall: Story = {
  name: '小サイズ',
  args: {
    voteCount: 3,
    hasVoted: true,
    voters: [
      { id: '1', nickname: 'user1' },
      { id: '2', nickname: 'user2' },
      { id: '3', nickname: 'user3' },
    ],
    size: 'sm',
    onVote: () => {},
  },
};

export const SizeMedium: Story = {
  name: '中サイズ',
  args: {
    voteCount: 3,
    hasVoted: true,
    voters: [
      { id: '1', nickname: 'user1' },
      { id: '2', nickname: 'user2' },
      { id: '3', nickname: 'user3' },
    ],
    size: 'md',
    onVote: () => {},
  },
};
