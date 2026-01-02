import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './useAuthStore';

import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('@/lib/kpt-api', () => ({
  fetchProfile: vi.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      loading: true,
      initialized: false,
    });
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されていること', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.loading).toBe(true);
      expect(state.initialized).toBe(false);
    });
  });

  describe('setUser', () => {
    it('ユーザーを設定できること', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
      } as User;

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('ユーザーをnullに設定できること', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
      } as User;

      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);

      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setSession', () => {
    it('セッションを設定できること', () => {
      const mockSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: {
          id: 'user-1',
          email: 'test@example.com',
        } as User,
      } as Session;

      useAuthStore.getState().setSession(mockSession);

      expect(useAuthStore.getState().session).toEqual(mockSession);
    });
  });

  describe('setProfile', () => {
    it('プロフィールを設定できること', () => {
      const mockProfile = {
        id: 'profile-1',
        nickname: 'Test User',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      useAuthStore.getState().setProfile(mockProfile);

      expect(useAuthStore.getState().profile).toEqual(mockProfile);
    });
  });

  describe('setLoading', () => {
    it('ローディング状態を変更できること', () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);

      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);
    });
  });

  describe('signOut', () => {
    it('サインアウト時に状態がクリアされること', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      useAuthStore.setState({
        user: { id: 'user-1' } as User,
        session: { access_token: 'token' } as Session,
        profile: {
          id: 'profile-1',
          nickname: 'Test',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalledOnce();
    });
  });

  describe('loadProfile', () => {
    it('プロフィールを正常に読み込めること', async () => {
      const { fetchProfile } = await import('@/lib/kpt-api');
      const mockProfile = {
        id: 'profile-1',
        nickname: 'Test User',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      vi.mocked(fetchProfile).mockResolvedValue(mockProfile);

      await useAuthStore.getState().loadProfile();

      expect(useAuthStore.getState().profile).toEqual(mockProfile);
      expect(fetchProfile).toHaveBeenCalledOnce();
    });

    it('プロフィール読み込みに失敗した場合、エラーをスローすること', async () => {
      const { fetchProfile } = await import('@/lib/kpt-api');
      const mockError = new Error('Failed to fetch profile');

      vi.mocked(fetchProfile).mockRejectedValue(mockError);

      await expect(useAuthStore.getState().loadProfile()).rejects.toThrow('Failed to fetch profile');

      expect(useAuthStore.getState().profile).toBeNull();
    });
  });

  describe('initialize', () => {
    it('セッションがない場合、正しく初期化されること', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as never);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledOnce();
    });

    it('セッションがある場合、プロフィールを読み込むこと', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      const { fetchProfile } = await import('@/lib/kpt-api');

      const mockSession = {
        access_token: 'token',
        user: { id: 'user-1', email: 'test@example.com' } as User,
      } as Session;

      const mockProfile = {
        id: 'profile-1',
        nickname: 'Test User',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(fetchProfile).mockResolvedValue(mockProfile);
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as never);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockSession.user);
      expect(state.session).toEqual(mockSession);
      expect(state.profile).toEqual(mockProfile);
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
      expect(fetchProfile).toHaveBeenCalledOnce();
    });

    it('既に初期化済みの場合、何もしないこと', async () => {
      const { supabase } = await import('@/lib/supabase-client');

      useAuthStore.setState({ initialized: true });

      await useAuthStore.getState().initialize();

      expect(supabase.auth.getSession).not.toHaveBeenCalled();
    });
  });

  describe('onAuthStateChange', () => {
    it('重複SIGNED_INイベントがスキップされること', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      const { fetchProfile } = await import('@/lib/kpt-api');

      const mockUser = { id: 'user-1', email: 'test@example.com' } as User;
      const mockSession = {
        access_token: 'token',
        user: mockUser,
      } as Session;
      const mockProfile = {
        id: 'profile-1',
        nickname: 'Test User',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      let authCallback: ((event: AuthChangeEvent, session: Session | null) => void | Promise<void>) | null = null;

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(fetchProfile).mockResolvedValue(mockProfile);
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as never;
      });

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().profile).toEqual(mockProfile);

      vi.mocked(fetchProfile).mockClear();

      await authCallback!('SIGNED_IN', mockSession);

      expect(fetchProfile).not.toHaveBeenCalled();
    });

    it('新規SIGNED_INイベントは処理されること', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      const { fetchProfile } = await import('@/lib/kpt-api');

      const mockUser1 = { id: 'user-1', email: 'test1@example.com' } as User;
      const mockSession1 = {
        access_token: 'token1',
        user: mockUser1,
      } as Session;
      const mockProfile1 = {
        id: 'profile-1',
        nickname: 'User 1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const mockUser2 = { id: 'user-2', email: 'test2@example.com' } as User;
      const mockSession2 = {
        access_token: 'token2',
        user: mockUser2,
      } as Session;
      const mockProfile2 = {
        id: 'profile-2',
        nickname: 'User 2',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      let authCallback: ((event: AuthChangeEvent, session: Session | null) => void | Promise<void>) | null = null;

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession1 },
        error: null,
      });
      vi.mocked(fetchProfile).mockResolvedValueOnce(mockProfile1).mockResolvedValueOnce(mockProfile2);
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as never;
      });

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().user).toEqual(mockUser1);
      expect(useAuthStore.getState().profile).toEqual(mockProfile1);

      await authCallback!('SIGNED_IN', mockSession2);

      expect(useAuthStore.getState().user).toEqual(mockUser2);
      expect(useAuthStore.getState().profile).toEqual(mockProfile2);
      expect(fetchProfile).toHaveBeenCalledTimes(2);
    });

    it('SIGNED_OUTイベントで状態がクリアされること', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      const { fetchProfile } = await import('@/lib/kpt-api');

      const mockUser = { id: 'user-1', email: 'test@example.com' } as User;
      const mockSession = {
        access_token: 'token',
        user: mockUser,
      } as Session;
      const mockProfile = {
        id: 'profile-1',
        nickname: 'Test User',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      let authCallback: ((event: AuthChangeEvent, session: Session | null) => void | Promise<void>) | null = null;

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(fetchProfile).mockResolvedValue(mockProfile);
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as never;
      });

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().profile).toEqual(mockProfile);

      await authCallback!('SIGNED_OUT', null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('プロフィール読み込みエラー時もloading状態がfalseになること', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      const { fetchProfile } = await import('@/lib/kpt-api');

      const mockUser = { id: 'user-1', email: 'test@example.com' } as User;
      const mockSession = {
        access_token: 'token',
        user: mockUser,
      } as Session;

      let authCallback: ((event: AuthChangeEvent, session: Session | null) => void | Promise<void>) | null = null;

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.mocked(fetchProfile).mockRejectedValue(new Error('Failed to fetch profile'));
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as never;
      });

      await useAuthStore.getState().initialize();

      await authCallback!('SIGNED_IN', mockSession);

      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().session).toEqual(mockSession);
    });
  });
});
