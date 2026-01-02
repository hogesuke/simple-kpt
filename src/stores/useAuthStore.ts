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
          supabase.auth.onAuthStateChange(async (event, session) => {
            const currentState = useAuthStore.getState();

            // 既に同じユーザーがログイン済みで、SIGNED_INイベントの場合はスキップ
            if (event === 'SIGNED_IN' && currentState.user?.id === session?.user?.id && currentState.profile) {
              return;
            }

            // ユーザーがログインした場合
            if (session?.user) {
              try {
                set({
                  session,
                  user: session?.user ?? null,
                  loading: true,
                });

                await useAuthStore.getState().loadProfile();

                set({ loading: false });
              } catch {
                set({ loading: false });
              }
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
        } catch {
          set({ loading: false, initialized: true });
        }
      },

      loadProfile: async () => {
        try {
          const profile = await fetchProfile();
          set({ profile });
        } catch (error) {
          set({ profile: null });
          throw error;
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null });
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
