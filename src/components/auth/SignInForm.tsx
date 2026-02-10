import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { FieldError } from '@/components/forms/FieldError';
import { FormErrorAlert } from '@/components/forms/FormErrorAlert';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { signInSchema, SignInFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';
import { zodResolverWithI18n } from '@/lib/zodResolverWithI18n';

export function SignInForm(): ReactElement {
  const { t } = useTranslation('auth');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SignInFormData>({
    resolver: zodResolverWithI18n(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInFormData) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError(t('メールアドレスまたはパスワードが正しくありません'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <FormErrorAlert>{error}</FormErrorAlert>}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          {t('メールアドレス')}
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
          {t('パスワード')}
        </label>
        <PasswordInput id="password" placeholder={t('パスワードを入力')} error={errors.password?.message} {...register('password')} />
      </div>

      <LoadingButton type="submit" className="h-10 w-full" loading={isSubmitting}>
        {t('ログイン')}
      </LoadingButton>

      <div className="-mt-2 text-center text-sm">
        <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground rounded underline">
          {t('パスワードをお忘れですか？')}
        </Link>
      </div>

      <div className="pt-2">
        <Button type="button" variant="outline" className="h-10 w-full" asChild>
          <Link to="/signup">{t('新規登録')}</Link>
        </Button>
      </div>
    </form>
  );
}
