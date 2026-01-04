import { ReactElement } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';

export function Layout(): ReactElement {
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <main className="min-h-0 flex-1">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
