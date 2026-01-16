import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/shadcn/button';
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
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

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

      <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        パスワードを変更
      </Button>
    </form>
  );
}
