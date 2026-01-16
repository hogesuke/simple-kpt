import { StrictMode, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { Toaster } from '@/components/shadcn/sonner';
import { router } from '@/router';
import { initializeAuth } from '@/stores/useAuthStore';
import './index.css';

function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
