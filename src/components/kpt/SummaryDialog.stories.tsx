import { MemoryRouter } from 'react-router';

import { SummaryDialog } from './SummaryDialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof SummaryDialog> = {
  title: 'KPT/SummaryDialog',
  component: SummaryDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    isOpen: true,
    onOpenChange: () => {},
    onGenerate: () => {},
    summary: '',
    remainingCount: 5,
    boardName: 'スプリント12 振り返り',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirm: Story = {
  name: '確認',
  args: {},
};

export const Generating: Story = {
  name: '生成中',
  args: {
    isLoading: true,
  },
};

export const Result: Story = {
  name: '結果',
  args: {
    summary: [
      '### Keep',
      '- 戦闘前の偵察が習慣化し、被ダメージが減っている',
      '- 装備の見直しを街ごとに実施できている',
      '',
      '### Problem',
      '- 作戦会議がなく、各自の動きがばらついている',
      '',
      '### Try',
      '- ダンジョン進入前に全員で作戦会議の時間を設ける',
    ].join('\n'),
  },
};
