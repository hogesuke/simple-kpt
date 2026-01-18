import { zodResolver } from '@hookform/resolvers/zod';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormErrorAlert } from '@/components/FormErrorAlert';
import { LoadingButton } from '@/components/LoadingButton';
import { PasswordInput } from '@/components/PasswordInput';
import { changePasswordSchema, ChangePasswordFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';

interface ChangePasswordFormProps {
  onSuccess: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps): ReactElement {
  const user = useAuthStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setError(null);

    if (!user?.email) {
      setError('ユーザー情報の取得に失敗しました');
      return;
    }

    // 現在のパスワードを検証するために再ログインを試みる
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    });

    if (signInError) {
      setError('現在のパスワードが正しくありません');
      return;
    }

    // パスワードを更新
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <FormErrorAlert>{error}</FormErrorAlert>}

      <div className="space-y-1">
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
          現在のパスワード
        </label>
        <PasswordInput id="currentPassword" error={errors.currentPassword?.message} {...register('currentPassword')} />
      </div>

      <div className="space-y-1">
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          新しいパスワード
        </label>
        <PasswordInput
          id="newPassword"
          placeholder="8文字以上で入力"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          新しいパスワード（確認）
        </label>
        <PasswordInput
          id="confirmPassword"
          placeholder="もう一度入力"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <div className="flex justify-end">
        <LoadingButton type="submit" loading={isSubmitting}>
          変更
        </LoadingButton>
      </div>
    </form>
  );
}
