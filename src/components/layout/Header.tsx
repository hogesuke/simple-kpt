import { LayoutDashboard, LogOut, Menu, Settings } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { Logotype } from '@/components/layout/Logotype';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { useHeaderPortal } from '@/contexts/HeaderPortalContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuthStore } from '@/stores/useAuthStore';

export function Header(): ReactElement {
  const { t } = useTranslation('ui');
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const { handleError } = useErrorHandler();
  const { setPortalRef } = useHeaderPortal();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      handleError(error, t('error:ログアウトに失敗しました'));
    }
  };

  // 背景は敷かず、下地のページ背景を透過させる（デザイン指定の透過ヘッダー）
  return (
    <header>
      <div className="mx-auto flex h-16 max-w-480 items-center justify-between px-9">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(user ? '/boards' : '/')}
            className="flex items-center gap-[11px] rounded hover:opacity-80"
          >
            {/* マークは装飾扱いにし、アクセシブルネームはロゴタイプ側で提供する */}
            <img src="/logo.svg" alt="" aria-hidden="true" className="h-[22px]" />
            {/* 19px / weight 900 のロゴタイプ相当の描画サイズ */}
            <Logotype className="h-[17.35px]" />
          </button>

          <SkipLink />
        </div>

        <div className="text-muted-foreground flex items-center gap-[22px] text-sm font-medium">
          {/* ページ固有のアクションを挿入するPortal。空のときは自身と後続の区切り線を隠す */}
          <div className="peer flex items-center gap-[22px] empty:hidden" ref={setPortalRef} />

          {/* 区切り線 */}
          <div className="bg-divider h-3.5 w-px peer-empty:hidden" aria-hidden="true" />

          {/* 設定グループ */}
          <div className="flex items-center gap-[22px]">
            <LanguageSelector />
            <ThemeToggle />
          </div>

          {/* 区切り線 */}
          <div className="bg-divider h-3.5 w-px" aria-hidden="true" />

          {/* 認証グループ */}
          {!user && (
            <div className="flex items-center gap-[22px]">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="hover:text-foreground rounded font-medium transition-colors"
              >
                {t('auth:ログイン')}
              </button>
              <Button variant="default" onClick={() => navigate('/signup')} className="h-auto px-[18px] py-[9px]">
                {t('auth:新規登録')}
              </Button>
            </div>
          )}

          {user && (
            <DropdownMenu>
              {/* アバターの頭文字＋ニックネームのピル。ニックネーム未設定時はメニューアイコンにフォールバックする */}
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border bg-card shadow-chip hover:bg-accent inline-flex items-center gap-2 rounded-full border py-[5px] pr-3 pl-1.5 transition-colors"
                  aria-label={t('ユーザーメニュー')}
                >
                  {profile?.nickname ? (
                    <>
                      <span className="bg-primary text-primary-foreground inline-flex size-7 items-center justify-center rounded-full text-[13px] font-bold">
                        {Array.from(profile.nickname)[0]}
                      </span>
                      <span className="text-[13.5px] font-bold">{profile.nickname}</span>
                    </>
                  ) : (
                    <span className="inline-flex size-7 items-center justify-center">
                      <Menu className="h-5 w-5" />
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[230px] p-0">
                {profile && (
                  <div className="border-border-subtle border-b px-4 py-3.5">
                    <p className="text-[13.5px] font-bold">{profile.nickname}</p>
                    {user.email && <p className="text-muted-foreground-subtle text-xs">{user.email}</p>}
                  </div>
                )}
                <div className="p-1.5">
                  <DropdownMenuItem onClick={() => navigate('/boards')}>
                    <LayoutDashboard className="text-icon h-4 w-4" />
                    {t('マイボード')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account', { state: { from: location.pathname } })}>
                    <Settings className="text-icon h-4 w-4" />
                    {t('アカウント設定')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    {t('auth:ログアウト')}
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
