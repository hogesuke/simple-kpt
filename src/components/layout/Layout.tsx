import { ReactElement, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { HeaderPortalProvider } from '@/contexts/HeaderPortalContext';

export function Layout(): ReactElement {
  const location = useLocation();

  // ページ遷移時にスクロール位置をトップに戻す
  // (ScrollRestorationはインラインスクリプトを注入する仕様により、CSP違反となるため使用しない)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <HeaderPortalProvider>
      <div className="flex h-screen flex-col">
        <Header />

        <main id="main-content" className="min-h-0 flex-1 dark:bg-neutral-900">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </HeaderPortalProvider>
  );
}
