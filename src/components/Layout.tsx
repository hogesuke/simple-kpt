import { ReactElement } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';
import { HeaderPortalProvider } from '@/contexts/HeaderPortalContext';

export function Layout(): ReactElement {
  const location = useLocation();

  return (
    <HeaderPortalProvider>
      <div className="flex h-screen flex-col">
        <Header />

        <main className="min-h-0 flex-1">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        <ScrollRestoration />
      </div>
    </HeaderPortalProvider>
  );
}
