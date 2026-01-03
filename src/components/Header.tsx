import { LogOut, Pencil, User } from 'lucide-react';
import { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { useAuthStore } from '@/stores/useAuthStore';

export function Header(): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      window.alert('ログアウトに失敗しました。');
    }
  };

  return (
    <header className="bg-white">
      <div className="mx-auto flex h-16 max-w-480 items-center justify-between px-8">
        <button type="button" onClick={() => navigate('/')} className="text-xl font-bold tracking-tight hover:opacity-80">
          KPT App
        </button>

        {user && (
          <div className="flex items-center gap-4">
            {/* ページ固有のアクションを挿入するPortal */}
            <div id={HEADER_ACTIONS_PORTAL_ID} className="flex items-center gap-2" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-blue-100 hover:bg-blue-200"
                  aria-label="ユーザーメニュー"
                >
                  <User className="h-5 w-5 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {profile && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">ニックネーム</span>
                        <span className="text-sm font-medium">{profile.nickname}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/setup-nickname')}>
                  <Pencil className="mr-2 h-4 w-4" />
                  ニックネーム変更
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
