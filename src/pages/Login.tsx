import { ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuthStore } from '@/stores/useAuthStore';

interface LocationState {
  from?: string;
}

export function Login(): ReactElement {
  const { t } = useTranslation('auth');
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const returnTo = state?.from || '/boards';

  useEffect(() => {
    // パスワードリカバリーモードの場合はリセットページにリダイレクト
    if (isPasswordRecovery) {
      navigate('/reset-password', { replace: true });
      return;
    }
    // 初期化が完了し、ユーザーがログインしている場合のみリダイレクト
    if (initialized && user) {
      navigate(returnTo, { replace: true });
    }
  }, [initialized, user, navigate, returnTo, isPasswordRecovery]);

  return (
    <>
      <title>{t('ログイン - Simple KPT')}</title>
      <AuthPageLayout title={t('Simple KPTにログイン')}>
        <SignInForm />
      </AuthPageLayout>
    </>
  );
}
