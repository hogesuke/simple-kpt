import { ReactElement, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { FieldError } from '@/components/forms/FieldError';
import { FormErrorAlert } from '@/components/forms/FormErrorAlert';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { signUpSchema, SignUpFormData } from '@/lib/schemas';
import { supabase } from '@/lib/supabase-client';
import { zodResolverWithI18n } from '@/lib/zodResolverWithI18n';

interface SignUpFormProps {
  onSignIn: () => void;
  onSuccess: () => void;
}

export function SignUpForm({ onSignIn, onSuccess }: SignUpFormProps): ReactElement {
  const { t } = useTranslation('auth');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolverWithI18n(signUpSchema),
    defaultValues: { email: '', password: '', agreeToTerms: false },
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
        setError(t('このメールアドレスは既に登録されています'));
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
        <PasswordInput id="password" placeholder={t('8文字以上で入力')} error={errors.password?.message} {...register('password')} />
      </div>

      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <Controller
            name="agreeToTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="agreeToTerms"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={!!errors.agreeToTerms}
                aria-describedby={errors.agreeToTerms ? 'agreeToTerms-error' : undefined}
                className="mt-0.5"
              />
            )}
          />
          <label htmlFor="agreeToTerms" className="text-sm leading-tight">
            <Trans
              i18nKey="<termsLink>利用規約</termsLink>と<privacyLink>プライバシーポリシー</privacyLink>に同意する"
              ns="auth"
              components={{
                termsLink: (
                  // eslint-disable-next-line jsx-a11y/anchor-has-content -- Transコンポーネントでテキストが挿入される
                  <a href="/terms" target="_blank" className="text-primary hover:underline dark:text-blue-400" />
                ),
                privacyLink: (
                  // eslint-disable-next-line jsx-a11y/anchor-has-content -- Transコンポーネントでテキストが挿入される
                  <a href="/privacy" target="_blank" className="text-primary hover:underline dark:text-blue-400" />
                ),
              }}
            />
          </label>
        </div>
        <FieldError id="agreeToTerms-error" message={errors.agreeToTerms?.message} />
      </div>

      <LoadingButton type="submit" className="h-10 w-full" loading={isSubmitting}>
        {t('アカウントを作成')}
      </LoadingButton>

      <div className="text-center text-sm">
        <button type="button" onClick={onSignIn} className="text-muted-foreground hover:text-foreground rounded underline">
          {t('すでにアカウントをお持ちですか？ログイン')}
        </button>
      </div>
    </form>
  );
}
