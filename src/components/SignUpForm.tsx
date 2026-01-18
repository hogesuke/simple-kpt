import { zodResolver } from '@hookform/resolvers/zod';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FieldError } from '@/components/FieldError';
import { FormErrorAlert } from '@/components/FormErrorAlert';
import { LoadingButton } from '@/components/LoadingButton';
import { PasswordInput } from '@/components/PasswordInput';
import { Input } from '@/components/shadcn/input';
import { signUpSchema, SignUpFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';

interface SignUpFormProps {
  onSignIn: () => void;
  onSuccess: () => void;
}

export function SignUpForm({ onSignIn, onSuccess }: SignUpFormProps): ReactElement {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message === 'User already registered') {
        setError('このメールアドレスは既に登録されています');
      } else {
        setError(error.message);
      }
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

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          パスワード
        </label>
        <PasswordInput id="password" placeholder="8文字以上で入力" error={errors.password?.message} {...register('password')} />
      </div>

      <LoadingButton type="submit" className="h-10 w-full" loading={isSubmitting}>
        アカウントを作成
      </LoadingButton>

      <div className="text-center text-sm">
        <button type="button" onClick={onSignIn} className="rounded text-gray-500 underline hover:text-gray-700">
          すでにアカウントをお持ちですか？ログイン
        </button>
      </div>
    </form>
  );
}
