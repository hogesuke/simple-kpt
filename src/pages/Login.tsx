import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { Button } from '@/components/shadcn/button';
import { SignInForm } from '@/components/SignInForm';
import { SignUpForm } from '@/components/SignUpForm';
import { useAuthStore } from '@/stores/useAuthStore';

interface LocationState {
  from?: string;
}

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password' | 'check_email' | 'reset_email_sent' | 'reset_password';

export function Login(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery);
  const setPasswordRecovery = useAuthStore((state) => state.setPasswordRecovery);
  const loadProfile = useAuthStore((state) => state.loadProfile);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const returnTo = state?.from || '/boards';
  const [authView, setAuthView] = useState<AuthView>('sign_in');

  // isPasswordRecoveryがtrueの場合はreset_passwordを優先する
  const currentView = useMemo<AuthView>(() => (isPasswordRecovery ? 'reset_password' : authView), [isPasswordRecovery, authView]);

  useEffect(() => {
    // パスワードリカバリーモードの場合はリダイレクトしない
    if (isPasswordRecovery) {
      return;
    }
    // 初期化が完了し、ユーザーがログインしている場合のみリダイレクト
    if (initialized && user) {
      navigate(returnTo, { replace: true });
    }
  }, [initialized, user, navigate, returnTo, isPasswordRecovery]);

  const getHeadingText = () => {
    switch (currentView) {
      case 'sign_up':
        return 'アカウント作成';
      case 'forgot_password':
        return 'パスワードをリセット';
      case 'check_email':
        return '確認メールを送信しました';
      case 'reset_email_sent':
        return 'メールを送信しました';
      case 'reset_password':
        return '新しいパスワードを設定';
      default:
        return 'Simple KPTにログイン';
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'sign_up':
        return <SignUpForm onSignIn={() => setAuthView('sign_in')} onSuccess={() => setAuthView('check_email')} />;
      case 'forgot_password':
        return <ForgotPasswordForm onSignIn={() => setAuthView('sign_in')} onSuccess={() => setAuthView('reset_email_sent')} />;
      case 'check_email':
        return (
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              確認メールを送信しました。メール内のリンクをクリックして、アカウントを有効化してください。
            </p>
            <button type="button" onClick={() => setAuthView('sign_in')} className="text-primary rounded hover:underline">
              ログインに戻る
            </button>
          </div>
        );
      case 'reset_email_sent':
        return (
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              パスワードリセット用のメールを送信しました。
              <br />
              メール内のリンクをクリックして、新しいパスワードを設定してください。
            </p>
            <Button type="button" className="h-10 w-full" onClick={() => setAuthView('sign_in')}>
              ログインに戻る
            </Button>
          </div>
        );
      case 'reset_password':
        return (
          <ResetPasswordForm
            onSuccess={async () => {
              setPasswordRecovery(false);
              await loadProfile();
              navigate('/boards', { replace: true });
            }}
          />
        );
      default:
        return <SignInForm onForgotPassword={() => setAuthView('forgot_password')} onSignUp={() => setAuthView('sign_up')} />;
    }
  };

  return (
    <>
      <title>ログイン - Simple KPT</title>
      <div className="flex h-full items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-center text-2xl font-bold">{getHeadingText()}</h2>
          </div>
          <div className="rounded-lg bg-white px-8 py-8 shadow">{renderContent()}</div>
        </div>
      </div>
    </>
  );
}
