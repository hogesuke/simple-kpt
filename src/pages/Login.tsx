import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';

interface LocationState {
  from?: string;
}

type AuthView = 'sign_in' | 'sign_up' | 'forgotten_password';

export function Login(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const returnTo = state?.from || '/';
  const [authView, setAuthView] = useState<AuthView>('sign_in');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初期化が完了し、ユーザーがログインしている場合のみリダイレクト
    if (initialized && user) {
      navigate(returnTo, { replace: true });
    }
  }, [initialized, user, navigate, returnTo]);

  // Supabase Auth UIのビュー変更を検知
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const detectView = () => {
      if (container.querySelector('#auth-sign-up')) {
        setAuthView('sign_up');
      } else if (container.querySelector('#auth-forgot-password')) {
        setAuthView('forgotten_password');
      } else {
        setAuthView('sign_in');
      }
    };

    // 初期検知
    detectView();

    // DOM変更を監視
    const observer = new MutationObserver(detectView);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const getHeadingText = () => {
    switch (authView) {
      case 'sign_up':
        return 'アカウント作成';
      case 'forgotten_password':
        return 'パスワードをリセット';
      default:
        return 'KPT Appにログイン';
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-2xl font-bold">{getHeadingText()}</h2>
        </div>
        <div ref={containerRef} className="rounded-lg bg-white px-8 py-8 shadow">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4278d2',
                    brandAccent: '#2a5fb7',
                  },
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  email_input_placeholder: 'your@email.com',
                  password_input_placeholder: 'パスワードを入力',
                  button_label: 'ログイン',
                  loading_button_label: 'ログイン中...',
                  social_provider_text: '{{provider}}でログイン',
                  link_text: 'すでにアカウントをお持ちですか？ログイン',
                },
                sign_up: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  email_input_placeholder: 'your@email.com',
                  password_input_placeholder: 'パスワードを入力',
                  button_label: 'アカウントを作成',
                  loading_button_label: '作成中...',
                  social_provider_text: '{{provider}}で新規登録',
                  link_text: '新規登録',
                  confirmation_text: '確認メールを確認してください',
                },
                forgotten_password: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  email_input_placeholder: 'your@email.com',
                  button_label: 'パスワードリセット用のメールを送信',
                  loading_button_label: '送信中...',
                  link_text: 'パスワードをお忘れですか？',
                  confirmation_text: 'パスワードリセット用のメールを確認してください',
                },
                update_password: {
                  password_label: '新しいパスワード',
                  password_input_placeholder: '新しいパスワードを入力',
                  button_label: 'パスワードを更新',
                  loading_button_label: '更新中...',
                  confirmation_text: 'パスワードが更新されました',
                },
                magic_link: {
                  email_input_label: 'メールアドレス',
                  email_input_placeholder: 'your@email.com',
                  button_label: 'マジックリンクを送信',
                  loading_button_label: '送信中...',
                  link_text: 'マジックリンクでログイン',
                  confirmation_text: 'マジックリンクを確認してください',
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    </div>
  );
}
