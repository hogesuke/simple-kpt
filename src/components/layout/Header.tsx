import { ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { Logotype } from '@/components/layout/Logotype';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useHeaderPortal } from '@/contexts/HeaderPortalContext';

export function Header(): ReactElement {
  const navigate = useNavigate();
  const { setPortalRef } = useHeaderPortal();

  // 背景は敷かず、下地のページ背景を透過させる（デザイン指定の透過ヘッダー）
  return (
    <header>
      <div className="mx-auto flex h-16 max-w-480 items-center justify-between px-9">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-[11px] rounded hover:opacity-80">
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
        </div>
      </div>
    </header>
  );
}
