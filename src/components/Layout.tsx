import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '@/components/Header';

export function Layout(): ReactElement {
  return (
    <div className="flex h-screen flex-col">
      <Header />

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
