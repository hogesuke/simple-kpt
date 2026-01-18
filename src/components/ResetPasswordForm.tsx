import { zodResolver } from '@hookform/resolvers/zod';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormErrorAlert } from '@/components/FormErrorAlert';
import { LoadingButton } from '@/components/LoadingButton';
import { PasswordInput } from '@/components/PasswordInput';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';

interface ResetPasswordFormProps {
  onSuccess: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps): ReactElement {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setError(error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <FormErrorAlert>{error}</FormErrorAlert>}

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          新しいパスワード
        </label>
        <PasswordInput id="password" placeholder="8文字以上で入力" error={errors.password?.message} {...register('password')} />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          新しいパスワード（確認）
        </label>
        <PasswordInput
          id="confirmPassword"
          placeholder="もう一度入力"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <LoadingButton type="submit" className="h-10 w-full" loading={isSubmitting}>
        パスワードを変更
      </LoadingButton>
    </form>
  );
}
