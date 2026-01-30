import { MemoryRouter } from 'react-router';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';

import { BoardTableRow } from './BoardTableRow';

import type { KptBoard } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockBoard: KptBoard = {
  id: 'board-1',
  name: 'アルファチーム振り返り',
  createdAt: '2026-01-15T10:00:00Z',
  ownerId: 'user-1',
};

const TableWrapper = ({ children }: { children: React.ReactNode }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ボード名</TableHead>
        <TableHead>役割</TableHead>
        <TableHead>作成日</TableHead>
        <TableHead className="w-12"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>{children}</TableBody>
  </Table>
);

const meta: Meta<typeof BoardTableRow> = {
  title: 'Board/BoardTableRow',
  component: BoardTableRow,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <TableWrapper>
          <Story />
        </TableWrapper>
      </MemoryRouter>
    ),
  ],
  args: {
    board: mockBoard,
    isOwner: true,
    isDeleting: false,
    isRenaming: false,
    onDelete: () => {},
    onRename: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AsOwner: Story = {
  name: 'オーナーとして表示',
  args: {
    isOwner: true,
  },
};

export const AsMember: Story = {
  name: 'メンバーとして表示',
  args: {
    isOwner: false,
  },
};

export const LongBoardName: Story = {
  name: '長いボード名',
  args: {
    board: {
      ...mockBoard,
      name: '１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０',
    },
  },
};

export const MultipleRows: Story = {
  name: '複数行',
  render: (args) => (
    <>
      <BoardTableRow
        board={{ id: '1', name: 'アルファチーム振り返り', createdAt: '2026-01-20T10:00:00Z', ownerId: 'user-1' }}
        isOwner={true}
        isDeleting={false}
        isRenaming={false}
        onDelete={args.onDelete}
        onRename={args.onRename}
      />
      <BoardTableRow
        board={{ id: '2', name: 'ベータチーム振り返り', createdAt: '2026-01-18T10:00:00Z', ownerId: 'user-2' }}
        isOwner={false}
        isDeleting={false}
        isRenaming={false}
        onDelete={args.onDelete}
        onRename={args.onRename}
      />
      <BoardTableRow
        board={{ id: '3', name: 'シータチーム振り返り', createdAt: '2026-01-10T10:00:00Z', ownerId: 'user-1' }}
        isOwner={true}
        isDeleting={false}
        isRenaming={false}
        onDelete={args.onDelete}
        onRename={args.onRename}
      />
    </>
  ),
};
