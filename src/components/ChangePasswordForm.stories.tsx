import { MockAuthProvider, mockUser, mockProfile } from '@storybook-mocks/MockAuthProvider';

import { ChangePasswordForm } from './ChangePasswordForm';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ChangePasswordForm> = {
  title: 'Account/ChangePasswordForm',
  component: ChangePasswordForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockAuthProvider
        state={{
          user: mockUser,
          profile: mockProfile,
        }}
      >
        <div className="max-w-md p-4">
          <Story />
        </div>
      </MockAuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト',
  args: {
    onSuccess: () => console.log('Password changed'),
  },
};
