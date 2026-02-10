import { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuthStore } from '@/stores/useAuthStore';

export function SignUp(): ReactElement {
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

  const heading = emailSent ? t('確認メールを送信しました') : t('アカウント作成');

  return (
    <>
      <title>{t('アカウント作成 - Simple KPT')}</title>
      <AuthPageLayout title={heading}>
        {emailSent ? (
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {t('確認メールを送信しました。メール内のリンクをクリックして、アカウントを有効化してください。')}
            </p>
            <button type="button" onClick={() => navigate('/login')} className="text-primary rounded hover:underline">
              {t('ログインに戻る')}
            </button>
          </div>
        ) : (
          <SignUpForm onSuccess={() => setEmailSent(true)} />
        )}
      </AuthPageLayout>
    </>
  );
}
