import { ArrowLeft } from 'lucide-react';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { AccountDeleteDialog } from '@/components/account/AccountDeleteDialog';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import { CharacterCounter } from '@/components/forms/CharacterCounter';
import { FieldError } from '@/components/forms/FieldError';
import { FormErrorAlert } from '@/components/forms/FormErrorAlert';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { Button } from '@/components/shadcn/button';
import { updateProfile } from '@/lib/kpt-api';
import { nicknameSchema, NicknameFormData } from '@/lib/schemas';
import { zodResolverWithI18n } from '@/lib/zodResolverWithI18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { NICKNAME_MAX_LENGTH } from '@shared/constants';

interface LocationState {
  from?: string;
}

export function AccountSettings(): ReactElement {
  const { t } = useTranslation('account');
  const profile = useAuthStore((state) => state.profile);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const returnTo = state?.from || '/';
  const setProfileStore = useAuthStore((state) => state.setProfile);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NicknameFormData>({
    resolver: zodResolverWithI18n(nicknameSchema),
    defaultValues: { nickname: '' },
  });

  const nickname = useWatch({ control, name: 'nickname', defaultValue: '' });

  // プロフィールが存在する場合、既存のニックネームを初期値として設定する
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (profile?.nickname && !isInitializedRef.current) {
      reset({ nickname: profile.nickname });
      isInitializedRef.current = true;
    }
  }, [profile, reset]);

  const onSubmit = async (data: NicknameFormData) => {
    try {
      const updatedProfile = await updateProfile(data.nickname);
      setProfileStore(updatedProfile);
      toast.success(t('ニックネームを更新しました'));
      navigate(returnTo, { replace: true });
    } catch {
      setError('root', { message: t('ニックネームの更新に失敗しました。もう一度お試しください。') });
    }
  };

  /** 初回設定かどうか */
  const isInitialSetup = !profile?.nickname;

  // 初回設定時はニックネーム設定のみ
  if (isInitialSetup) {
    return (
      <>
        <title>{t('アカウント設定 - Simple KPT')}</title>
        <div className="flex h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-[528px]">
            <div className="mb-7 text-center">
              <h2 className="text-2xl font-black tracking-tight">{t('ニックネームの設定')}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{t('アプリで表示される名前を設定してください')}</p>
            </div>

            <div className="border-border-subtle bg-card rounded-column shadow-card border px-[30px] pt-[30px] pb-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {errors.root && <FormErrorAlert>{errors.root.message}</FormErrorAlert>}

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="nickname" className="block text-[13.5px] font-bold">
                      {t('board:ニックネーム')}
                    </label>
                    <CharacterCounter current={nickname.length} max={NICKNAME_MAX_LENGTH} />
                  </div>
                  <div className="mt-1">
                    <input
                      id="nickname"
                      type="text"
                      autoComplete="off"
                      {...register('nickname')}
                      aria-invalid={!!errors.nickname}
                      aria-describedby={errors.nickname ? 'nickname-error' : undefined}
                      className="border-input bg-card placeholder:text-placeholder block w-full appearance-none rounded-lg border px-3 py-2 shadow-sm sm:text-sm"
                      placeholder={t('ふりかえり太郎')}
                      disabled={isSubmitting}
                    />
                  </div>
                  <FieldError id="nickname-error" message={errors.nickname?.message} />
                </div>

                <LoadingButton type="submit" loading={isSubmitting} className="w-full">
                  {t('ui:保存')}
                </LoadingButton>
              </form>
            </div>
          </div>

          <AccountDeleteDialog isOpen={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
        </div>
      </>
    );
  }

  // アカウント設定画面
  return (
    <>
      <title>{t('アカウント設定 - Simple KPT')}</title>
      <div className="min-h-full py-8">
        <div className="mx-auto max-w-[648px] px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(returnTo, { replace: true })}
            className="text-muted-foreground hover:text-foreground mb-3.5 inline-flex items-center gap-1.5 rounded text-[13px] font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('ui:戻る')}
          </button>

          <div className="mb-9">
            <h1 className="mb-1.5 text-[26px] font-black">{t('ui:アカウント設定')}</h1>
            <p className="text-muted-foreground text-sm">{t('プロフィールやアカウントの管理ができます')}</p>
          </div>

          {/* ニックネーム */}
          <section className="mb-10">
            <h2 className="mb-3.5 text-base font-black">{t('ニックネームの変更')}</h2>
            <div className="border-border-subtle bg-card rounded-column shadow-card border px-7 py-[26px]">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && <FormErrorAlert>{errors.root.message}</FormErrorAlert>}

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="nickname" className="block text-[13.5px] font-bold">
                      {t('board:ニックネーム')}
                    </label>
                    <CharacterCounter current={nickname.length} max={NICKNAME_MAX_LENGTH} />
                  </div>
                  <input
                    id="nickname"
                    type="text"
                    autoComplete="off"
                    {...register('nickname')}
                    aria-invalid={!!errors.nickname}
                    aria-describedby={errors.nickname ? 'nickname-error' : undefined}
                    className="border-input bg-card placeholder:text-placeholder mt-2 block w-full rounded-[11px] border px-3.5 py-3 text-[14.5px] shadow-sm"
                    placeholder={t('ふりかえり太郎')}
                    disabled={isSubmitting}
                  />
                  <FieldError id="nickname-error" message={errors.nickname?.message} />
                </div>

                <div className="flex justify-end pt-1.5">
                  <LoadingButton type="submit" loading={isSubmitting} className="h-auto px-7 py-[11px]">
                    {t('ui:変更')}
                  </LoadingButton>
                </div>
              </form>
            </div>
          </section>

          {/* パスワード変更 */}
          <section className="mb-10">
            <h2 className="mb-3.5 text-base font-black">{t('パスワードの変更')}</h2>
            <div className="border-border-subtle bg-card rounded-column shadow-card border px-7 py-[26px]">
              <ChangePasswordForm onSuccess={() => toast.success(t('パスワードを変更しました'))} />
            </div>
          </section>

          {/* アカウント削除 */}
          <section>
            <h2 className="mb-3.5 text-base font-black">{t('アカウントの削除')}</h2>
            <div className="border-destructive-border bg-destructive-surface rounded-column flex flex-col gap-4 border px-7 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="text-destructive-text text-[13.5px] leading-[1.75]">
                {t('アカウントを削除すると、すべてのデータが完全に削除されます。')}
                {t('この操作は取り消すことができません。')}
              </p>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-auto shrink-0 px-6 py-3 shadow-[0_12px_24px_-12px_rgb(214_58_82_/_0.8)]"
              >
                {t('アカウントを削除')}
              </Button>
            </div>
          </section>
        </div>

        <AccountDeleteDialog isOpen={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
      </div>
    </>
  );
}
