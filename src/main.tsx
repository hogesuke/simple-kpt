import { StrictMode, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider } from 'react-router';

import { Toaster } from '@/components/shadcn/sonner';
import { TooltipProvider } from '@/components/shadcn/tooltip';
import i18n from '@/i18n';
import { initSentry } from '@/lib/sentry';
import { router } from '@/router';
import { initializeAuth } from '@/stores/useAuthStore';
import './index.css';

initSentry();

function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </I18nextProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
