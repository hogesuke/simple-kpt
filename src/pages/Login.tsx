import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { ReactElement, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';

export function Login(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const navigate = useNavigate();

  useEffect(() => {
    // 初期化が完了し、ユーザーがログインしている場合のみリダイレクト
    if (initialized && user) {
      navigate('/', { replace: true });
    }
  }, [initialized, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">KPT App</h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">ログインまたはアカウントを作成</p>
        </div>
        <div className="rounded-lg bg-white px-8 py-8 shadow">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
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
                  social_provider_text: '{{provider}}でサインアップ',
                  link_text: 'アカウントをお持ちでないですか？サインアップ',
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
