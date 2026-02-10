import { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Button } from '@/components/shadcn/button';
import { useAuthStore } from '@/stores/useAuthStore';

export function ForgotPassword(): ReactElement {
  const { t } = useTranslation('auth');
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (initialized && user) {
      navigate('/boards', { replace: true });
    }
  }, [initialized, user, navigate]);

  const heading = emailSent ? t('メールを送信しました') : t('パスワードをリセット');

  return (
    <>
      <title>{t('パスワードをリセット - Simple KPT')}</title>
      <AuthPageLayout title={heading}>
        {emailSent ? (
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {t('パスワードリセット用のメールを送信しました。')}
              <br />
              {t('メール内のリンクをクリックして、新しいパスワードを設定してください。')}
            </p>
            <Button type="button" className="h-10 w-full" onClick={() => navigate('/login')}>
              {t('ログインに戻る')}
            </Button>
          </div>
        ) : (
          <ForgotPasswordForm onSuccess={() => setEmailSent(true)} />
        )}
      </AuthPageLayout>
    </>
  );
}
