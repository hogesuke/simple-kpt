import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FieldError } from '@/components/FieldError';
import { FormErrorAlert } from '@/components/FormErrorAlert';
import { Button } from '@/components/shadcn/button';
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
      setError(error.message);
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

      <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        パスワードリセット用のメールを送信
      </Button>

      <div className="text-center text-sm">
        <button type="button" onClick={onSignIn} className="rounded text-gray-500 underline hover:text-gray-700">
          ログインに戻る
        </button>
      </div>
    </form>
  );
}
