import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { fetchProfile } from '@/lib/kpt-api';
import { supabase } from '@/lib/supabase-client';

import type { UserProfile } from '@/types/kpt';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,
      initialized: false,

      initialize: async () => {
        // 既に初期化済みなら何もしない
        const { initialized } = useAuthStore.getState();
        if (initialized) return;

        try {
          // 初期セッションを取得
          const {
            data: { session },
          } = await supabase.auth.getSession();

          set({
            session,
            user: session?.user ?? null,
          });

          // ユーザーがログインしている場合、プロフィールを取得する
          if (session?.user) {
            await useAuthStore.getState().loadProfile();
          }

          set({
            loading: false,
            initialized: true,
          });

          // 認証状態の変更を監視
          supabase.auth.onAuthStateChange(async (_event, session) => {
            // ユーザーがログインした場合
            if (session?.user) {
              set({
                session,
                user: session?.user ?? null,
                loading: true,
              });
              await useAuthStore.getState().loadProfile();
              set({ loading: false });
            } else {
              // ユーザーがログアウトした場合
              set({
                session,
                user: null,
                profile: null,
                loading: false,
              });
            }
          });
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          set({ loading: false, initialized: true });
        }
      },

      loadProfile: async () => {
        try {
          const profile = await fetchProfile();
          set({ profile });
        } catch (error) {
          console.error('Failed to load profile:', error);
          set({ profile: null });
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, session: null, profile: null });
        } catch (error) {
          console.error('Failed to sign out:', error);
          throw error;
        }
      },

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: 'AuthStore' }
  )
);

// 初期化用のヘルパー関数
export const initializeAuth = () => {
  const initialize = useAuthStore.getState().initialize;
  return initialize();
};
