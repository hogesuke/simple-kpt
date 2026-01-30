import { ReactElement } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { HeaderPortalProvider } from '@/contexts/HeaderPortalContext';

export function Layout(): ReactElement {
  const location = useLocation();

  return (
    <HeaderPortalProvider>
      <div className="flex h-screen flex-col">
        <Header />

        <main id="main-content" className="min-h-0 flex-1 dark:bg-neutral-900">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        <ScrollRestoration />
      </div>
    </HeaderPortalProvider>
  );
}
