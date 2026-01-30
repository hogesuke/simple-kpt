import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';

import { BoardTableRowSkeleton } from './BoardTableRowSkeleton';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof BoardTableRowSkeleton> = {
  title: 'Layout/BoardTableRowSkeleton',
  component: BoardTableRowSkeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ボード名</TableHead>
          <TableHead>メンバー</TableHead>
          <TableHead>更新日</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <BoardTableRowSkeleton />
      </TableBody>
    </Table>
  ),
};

export const MultipleRows: Story = {
  name: '複数行',
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ボード名</TableHead>
          <TableHead>メンバー</TableHead>
          <TableHead>更新日</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <BoardTableRowSkeleton />
        <BoardTableRowSkeleton />
        <BoardTableRowSkeleton />
      </TableBody>
    </Table>
  ),
};
