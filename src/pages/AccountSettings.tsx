import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { AccountDeleteDialog } from '@/components/AccountDeleteDialog';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { CharacterCounter } from '@/components/CharacterCounter';
import { FieldError } from '@/components/FieldError';
import { FormErrorAlert } from '@/components/FormErrorAlert';
import { LoadingButton } from '@/components/LoadingButton';
import { Button } from '@/components/shadcn/button';
import { updateProfile } from '@/lib/kpt-api';
import { nicknameSchema, NicknameFormData } from '@/lib/schemas';
import { useAuthStore } from '@/stores/useAuthStore';
import { NICKNAME_MAX_LENGTH } from '@shared/constants';

interface LocationState {
  from?: string;
}

export function AccountSettings(): ReactElement {
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
    resolver: zodResolver(nicknameSchema),
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
      toast.success('ニックネームを更新しました');
      navigate(returnTo, { replace: true });
    } catch {
      setError('root', { message: 'ニックネームの更新に失敗しました。もう一度お試しください。' });
    }
  };

  /** 初回設定かどうか */
  const isInitialSetup = !profile?.nickname;

  // 初回設定時はニックネーム設定のみ
  if (isInitialSetup) {
    return (
      <>
        <title>アカウント設定 - Simple KPT</title>
        <div className="flex h-full items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">ニックネームの設定</h2>
              <p className="text-muted-foreground mt-2 text-center text-sm">アプリで表示される名前を設定してください</p>
            </div>

            <div className="rounded-lg bg-white px-8 py-8 shadow">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {errors.root && <FormErrorAlert>{errors.root.message}</FormErrorAlert>}

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                      ニックネーム
                    </label>
                    <CharacterCounter current={nickname.length} max={NICKNAME_MAX_LENGTH} />
                  </div>
                  <div className="mt-1">
                    <input
                      id="nickname"
                      type="text"
                      autoComplete="off"
                      {...register('nickname')}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm sm:text-sm"
                      placeholder="e.g. Taro"
                      disabled={isSubmitting}
                    />
                  </div>
                  <FieldError id="nickname-error" message={errors.nickname?.message} />
                </div>

                <LoadingButton type="submit" loading={isSubmitting} className="w-full">
                  設定
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
      <title>アカウント設定 - Simple KPT</title>
      <div className="min-h-full bg-gray-50 py-8">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(returnTo, { replace: true })}
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 rounded text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">アカウント設定</h1>
            <p className="text-muted-foreground mt-1 text-sm">プロフィールやアカウントの管理ができます</p>
          </div>

          {/* ニックネーム */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-gray-900">ニックネーム</h2>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && <FormErrorAlert>{errors.root.message}</FormErrorAlert>}

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                      表示名
                    </label>
                    <CharacterCounter current={nickname.length} max={NICKNAME_MAX_LENGTH} />
                  </div>
                  <input
                    id="nickname"
                    type="text"
                    autoComplete="off"
                    {...register('nickname')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm"
                    placeholder="e.g. Taro"
                    disabled={isSubmitting}
                  />
                  <FieldError id="nickname-error" message={errors.nickname?.message} />
                </div>

                <div className="flex justify-end">
                  <LoadingButton type="submit" loading={isSubmitting}>
                    更新
                  </LoadingButton>
                </div>
              </form>
            </div>
          </section>

          {/* パスワード変更 */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-gray-900">パスワードの変更</h2>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <ChangePasswordForm onSuccess={() => toast.success('パスワードを変更しました')} />
            </div>
          </section>

          {/* アカウント削除 */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-gray-900">アカウントの削除</h2>
            <div className="rounded-lg border border-red-500 bg-white p-6">
              <p className="text-muted-foreground mb-4 text-sm">
                アカウントを削除すると、すべてのデータが完全に削除されます。
                <br />
                この操作は取り消すことができません。
              </p>
              <div className="flex justify-end">
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  アカウントを削除
                </Button>
              </div>
            </div>
          </section>
        </div>

        <AccountDeleteDialog isOpen={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
      </div>
    </>
  );
}
