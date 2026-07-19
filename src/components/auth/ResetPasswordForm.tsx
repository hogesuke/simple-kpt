import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormErrorAlert } from '@/components/forms/FormErrorAlert';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';
import { zodResolverWithI18n } from '@/lib/zodResolverWithI18n';

interface ResetPasswordFormProps {
  onSuccess: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps): ReactElement {
  const { t } = useTranslation('auth');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolverWithI18n(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setError(t('パスワードの変更に失敗しました'));
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <FormErrorAlert>{error}</FormErrorAlert>}

      <div className="space-y-1">
        <label htmlFor="password" className="block text-[13.5px] font-bold">
          {t('新しいパスワード')}
        </label>
        <PasswordInput id="password" placeholder={t('8文字以上で入力')} error={errors.password?.message} {...register('password')} />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="block text-[13.5px] font-bold">
          {t('新しいパスワード（確認）')}
        </label>
        <PasswordInput
          id="confirmPassword"
          placeholder={t('もう一度入力')}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <LoadingButton type="submit" className="h-12 w-full text-[15px]" loading={isSubmitting}>
        {t('パスワードを変更')}
      </LoadingButton>
    </form>
  );
}
