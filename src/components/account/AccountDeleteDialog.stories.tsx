import { useState } from 'react';
import { MemoryRouter } from 'react-router';

import { Button } from '@/components/shadcn/button';
import { MockAuthProvider } from '@storybook-mocks/MockAuthProvider';
import { mockOwnedBoards } from '@storybook-mocks/MockKptApi';

import { AccountDeleteDialog } from './AccountDeleteDialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AccountDeleteDialog> = {
  title: 'Account/AccountDeleteDialog',
  component: AccountDeleteDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <MockAuthProvider>
          <Story />
        </MockAuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  loaders: [
    async () => {
      // fetchをモックしてSupabase Edge FunctionsのAPIリクエストをインターセプト
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.toString();

        // get-owned-boards APIをモック（Supabase Edge Function）
        if (url.includes('get-owned-boards')) {
          return new Response(JSON.stringify({ boards: mockOwnedBoards }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // delete-account APIをモック
        if (url.includes('delete-account')) {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return originalFetch(input, init);
      };

      return { originalFetch };
    },
  ],
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-4">
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          アカウントを削除
        </Button>
        <AccountDeleteDialog isOpen={isOpen} onOpenChange={setIsOpen} />
      </div>
    );
  },
};
