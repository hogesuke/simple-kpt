import { Table, TableBody, TableHead, TableHeader, TableRow } from './shadcn/table';
import { TryTableRowSkeleton } from './TryTableRowSkeleton';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TryTableRowSkeleton> = {
  title: 'KPT/TryTableRowSkeleton',
  component: TryTableRowSkeleton,
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
          <TableHead>内容</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>担当者</TableHead>
          <TableHead>期日</TableHead>
          <TableHead>投票</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TryTableRowSkeleton />
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
          <TableHead>内容</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>担当者</TableHead>
          <TableHead>期日</TableHead>
          <TableHead>投票</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TryTableRowSkeleton />
        <TryTableRowSkeleton />
        <TryTableRowSkeleton />
        <TryTableRowSkeleton />
        <TryTableRowSkeleton />
      </TableBody>
    </Table>
  ),
};
