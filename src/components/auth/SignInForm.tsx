import { zodResolver } from '@hookform/resolvers/zod';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FieldError } from '@/components/forms/FieldError';
import { FormErrorAlert } from '@/components/forms/FormErrorAlert';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { signInSchema, SignInFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';

interface SignInFormProps {
  onForgotPassword: () => void;
  onSignUp: () => void;
}

export function SignInForm({ onForgotPassword, onSignUp }: SignInFormProps): ReactElement {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInFormData) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません');
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

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          パスワード
        </label>
        <PasswordInput id="password" placeholder="パスワードを入力" error={errors.password?.message} {...register('password')} />
      </div>

      <LoadingButton type="submit" className="h-10 w-full" loading={isSubmitting}>
        ログイン
      </LoadingButton>

      <div className="-mt-2 text-center text-sm">
        <button type="button" onClick={onForgotPassword} className="text-muted-foreground hover:text-foreground rounded underline">
          パスワードをお忘れですか？
        </button>
      </div>

      <div className="pt-2">
        <Button type="button" variant="outline" className="h-10 w-full" onClick={onSignUp}>
          新規登録
        </Button>
      </div>
    </form>
  );
}
