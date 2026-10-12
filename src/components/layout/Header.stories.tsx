import { MemoryRouter } from 'react-router';

import { HeaderPortalProvider } from '@/contexts/HeaderPortalContext';

import { Header } from './Header';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <HeaderPortalProvider>
          <Story />
        </HeaderPortalProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
};
