import { ReactNode, useEffect } from 'react';

import { useAuthStore } from '@/stores/useAuthStore';

import type { UserProfile } from '@/types/kpt';
import type { User } from '@supabase/supabase-js';

// サンプルユーザー
export const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

// サンプルプロフィール
export const mockProfile: UserProfile = {
  id: 'user-1',
  nickname: 'テストユーザー',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface MockAuthState {
  user?: User | null;
  profile?: UserProfile | null;
  loading?: boolean;
  initialized?: boolean;
  isLoadingProfile?: boolean;
  isPasswordRecovery?: boolean;
}

interface MockAuthProviderProps {
  children: ReactNode;
  state?: MockAuthState;
}

/**
 * Storybook用のAuthStoreモックプロバイダー
 * Zustandストアの状態を一時的に上書きする
 */
export function MockAuthProvider({ children, state = {} }: MockAuthProviderProps) {
  useEffect(() => {
    // ストアの状態を設定
    const store = useAuthStore.getState();

    // デフォルト値とマージ
    const mockState = {
      user: mockUser,
      profile: mockProfile,
      loading: false,
      initialized: true,
      isLoadingProfile: false,
      isPasswordRecovery: false,
      ...state,
    };

    // 各プロパティを設定
    store.setUser(mockState.user);
    store.setProfile(mockState.profile);
    store.setLoading(mockState.loading);

    // クリーンアップ時にリセット
    return () => {
      store.setUser(null);
      store.setProfile(null);
      store.setLoading(true);
    };
  }, [state]);

  return <>{children}</>;
}

/**
 * ログアウト状態のモック
 */
export function MockAuthProviderLoggedOut({ children }: { children: ReactNode }) {
  return (
    <MockAuthProvider
      state={{
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      }}
    >
      {children}
    </MockAuthProvider>
  );
}

/**
 * ローディング状態のモック
 */
export function MockAuthProviderLoading({ children }: { children: ReactNode }) {
  return (
    <MockAuthProvider
      state={{
        user: null,
        profile: null,
        loading: true,
        initialized: false,
      }}
    >
      {children}
    </MockAuthProvider>
  );
}
