import { zodResolver } from '@hookform/resolvers/zod';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FieldError } from '@/components/forms/FieldError';
import { FormErrorAlert } from '@/components/forms/FormErrorAlert';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { Input } from '@/components/shadcn/input';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';

interface ForgotPasswordFormProps {
  onSignIn: () => void;
  onSuccess: () => void;
}

export function ForgotPasswordForm({ onSignIn, onSuccess }: ForgotPasswordFormProps): ReactElement {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setError('パスワードリセットメールの送信に失敗しました');
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <FormErrorAlert>{error}</FormErrorAlert>}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          メールアドレス
        </label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>

      <LoadingButton type="submit" className="h-10 w-full" loading={isSubmitting}>
        パスワードリセット用のメールを送信
      </LoadingButton>

      <div className="text-center text-sm">
        <button type="button" onClick={onSignIn} className="text-muted-foreground hover:text-foreground rounded underline">
          ログインに戻る
        </button>
      </div>
    </form>
  );
}
