import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';

import { MockBoardProvider } from '@storybook-mocks/MockBoardProvider';
import { MockBoardStoreProvider } from '@storybook-mocks/MockBoardStoreProvider';

import { KPTBoardHeader } from './KPTBoardHeader';

const meta: Meta<typeof KPTBoardHeader> = {
  title: 'KPT/Board/KPTBoardHeader',
  component: KPTBoardHeader,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockBoardProvider>
          <MockBoardStoreProvider>
            <div className="p-4">
              <Story />
            </div>
          </MockBoardStoreProvider>
        </MockBoardProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
};
