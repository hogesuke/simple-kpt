import { LogOut, Settings, User } from 'lucide-react';
import { ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { HEADER_ACTIONS_PORTAL_ID } from '@/components/HeaderActions';
import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuthStore } from '@/stores/useAuthStore';

export function Header(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const { handleError } = useErrorHandler();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      handleError(error, 'ログアウトに失敗しました');
    }
  };

  return (
    <header className="bg-white">
      <div className="mx-auto flex h-16 max-w-480 items-center justify-between px-8">
        <button type="button" onClick={() => navigate('/')} className="text-xl font-bold tracking-tight hover:opacity-80">
          KPT App
        </button>

        <div className="flex items-center gap-4">
          {/* ページ固有のアクションを挿入するPortal */}
          <div id={HEADER_ACTIONS_PORTAL_ID} className="flex items-center gap-2" />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-primary/30 bg-primary/10 hover:bg-primary/20 h-9 w-9 rounded-full border"
                  aria-label="ユーザーメニュー"
                >
                  {profile ? (
                    <span className="text-primary text-sm font-medium">{profile.nickname.charAt(0).toUpperCase()}</span>
                  ) : (
                    <User className="text-primary h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {profile && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">ニックネーム</span>
                        <span className="text-sm font-medium">{profile.nickname}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/90" />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/account', { state: { from: location.pathname } })}>
                  <Settings className="h-4 w-4" />
                  アカウント設定
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
