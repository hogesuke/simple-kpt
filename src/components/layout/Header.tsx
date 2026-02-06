import { LogIn, LogOut, Settings, User, UserPlus } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  return (
    <header className="border-border bg-background border-b">
      <div className="mx-auto flex h-16 max-w-480 items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(user ? '/boards' : '/')}
            className="flex items-center gap-3 rounded text-xl font-bold tracking-tight hover:opacity-80"
          >
            <img src="/logo.svg" alt={t('Simple KPTロゴ')} className="h-5" />
            <img src="/logotype.svg" alt="Simple KPT" className="h-6 dark:invert" />
          </button>

          <SkipLink />
        </div>

        <div className="flex items-center gap-4">
          {/* ページ固有のアクションを挿入するPortal */}
          <div ref={setPortalRef} className="flex items-center gap-2" />

          <LanguageSelector />
          <ThemeToggle />

          {!user && (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                <LogIn className="h-4 w-4" />
                {t('auth:ログイン')}
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate('/login', { state: { view: 'sign_up' } })}>
                <UserPlus className="h-4 w-4" />
                {t('auth:新規登録')}
              </Button>
            </>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-primary/30 bg-primary/10 hover:bg-primary/20 h-9 w-9 rounded-full border"
                  aria-label={t('ユーザーメニュー')}
                >
                  {profile ? (
                    <span className="text-primary text-sm font-medium">{profile.nickname.charAt(0).toUpperCase()}</span>
                  ) : (
                    <User className="text-primary h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {profile && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 self-center" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{profile.nickname}</span>
                          {user.email && <span className="text-muted-foreground/80 text-sm">{user.email}</span>}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/90" />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/account', { state: { from: location.pathname } })}>
                  <Settings className="h-4 w-4" />
                  {t('アカウント設定')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  {t('auth:ログアウト')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
