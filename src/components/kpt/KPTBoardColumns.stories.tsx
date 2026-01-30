import { DndContext } from '@dnd-kit/core';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TooltipProvider } from '@/components/shadcn/tooltip';
import { MockBoardStoreProvider, mockBoardItems } from '@storybook-mocks/MockBoardStoreProvider';

import { KPTBoardColumns } from './KPTBoardColumns';

import type { KptItem } from '@/types/kpt';
import type { Meta, StoryObj } from '@storybook/react-vite';

// カラムごとにアイテムをグループ化
function groupItemsByColumn(items: KptItem[]) {
  return {
    keep: items.filter((item) => item.column === 'keep'),
    problem: items.filter((item) => item.column === 'problem'),
    try: items.filter((item) => item.column === 'try'),
  };
}

const meta: Meta<typeof KPTBoardColumns> = {
  title: 'KPT/Board/KPTBoardColumns',
  component: KPTBoardColumns,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/boards/board-1']}>
        <Routes>
          <Route
            path="/boards/:boardId"
            element={
              <DndContext>
                <TooltipProvider>
                  <MockBoardStoreProvider>
                    <div className="grid grid-cols-3 gap-4 p-4">
                      <Story />
                    </div>
                  </MockBoardStoreProvider>
                </TooltipProvider>
              </DndContext>
            }
          />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    itemsByColumn: groupItemsByColumn(mockBoardItems),
    onCardClick: (item) => console.log('Click:', item),
  },
};
