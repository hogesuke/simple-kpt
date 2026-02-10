import { ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { useAuthStore } from '@/stores/useAuthStore';

export function ResetPassword(): ReactElement {
  const { t } = useTranslation('auth');
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery);
  const setPasswordRecovery = useAuthStore((state) => state.setPasswordRecovery);
  const loadProfile = useAuthStore((state) => state.loadProfile);
  const initialized = useAuthStore((state) => state.initialized);
  const navigate = useNavigate();

  useEffect(() => {
    // パスワードリカバリーモードでない場合はログインページにリダイレクト
    if (initialized && !isPasswordRecovery) {
      navigate('/login', { replace: true });
    }
  }, [initialized, isPasswordRecovery, navigate]);

  return (
    <>
      <title>{t('新しいパスワードを設定 - Simple KPT')}</title>
      <AuthPageLayout title={t('新しいパスワードを設定')}>
        <ResetPasswordForm
          onSuccess={async () => {
            setPasswordRecovery(false);
            await loadProfile();
            navigate('/boards', { replace: true });
          }}
        />
      </AuthPageLayout>
    </>
  );
}
