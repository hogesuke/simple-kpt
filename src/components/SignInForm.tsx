import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';

import { PasswordInput } from '@/components/PasswordInput';
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
      if (error.message === 'Invalid login credentials') {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          メールアドレス
        </label>
        <Input id="email" type="email" placeholder="your@email.com" {...register('email')} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          パスワード
        </label>
        <PasswordInput id="password" placeholder="パスワードを入力" error={errors.password?.message} {...register('password')} />
      </div>

      <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        ログイン
      </Button>

      <div className="-mt-2 text-center text-sm">
        <button type="button" onClick={onForgotPassword} className="text-gray-500 underline hover:text-gray-700">
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
