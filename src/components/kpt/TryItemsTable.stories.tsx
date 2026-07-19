import { MemoryRouter } from 'react-router';

import { TryItemsTable } from './TryItemsTable';

import type { TryItemWithBoard } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseItem: TryItemWithBoard = {
  id: 'try-1',
  boardId: 'board-1',
  boardName: 'アルファチーム振り返り',
  column: 'try',
  text: 'ダンジョンに入る前に全員で作戦会議の時間を設ける',
  position: 0,
  authorId: 'user-1',
  authorNickname: '勇者ペペロン',
  status: 'pending',
  assigneeId: 'user-2',
  assigneeNickname: '僧侶ポッピー',
  dueDate: null,
};

const meta: Meta<typeof TryItemsTable> = {
  title: 'KPT/TryItemsTable',
  component: TryItemsTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    items: [baseItem],
    onAssigneeClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleRows: Story = {
  name: '複数行',
  args: {
    items: [
      baseItem,
      {
        ...baseItem,
        id: 'try-2',
        text: '野営時は見張りの当番表を作って交代制にする',
        status: 'in_progress',
        dueDate: '2026-02-28',
        boardName: '最初のボード',
      },
      {
        ...baseItem,
        id: 'try-3',
        text: '魔法使いは後衛に配置して詠唱に専念する',
        status: 'done',
        assigneeNickname: '魔法使いピヨンヌ',
        dueDate: '2026-06-30',
      },
      {
        ...baseItem,
        id: 'try-4',
        text: '担当者も期日も未設定のTry',
        status: null,
        assigneeId: null,
        assigneeNickname: null,
        dueDate: null,
      },
    ],
  },
};

export const Overdue: Story = {
  name: '期日超過',
  args: {
    items: [{ ...baseItem, status: 'in_progress', dueDate: '2020-01-01' }],
  },
};

export const Loading: Story = {
  name: '読み込み中',
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  name: 'アイテムなし',
  args: {
    items: [],
  },
};
