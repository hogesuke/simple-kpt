import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/useAuthStore';

interface ProtectedRouteProps {
  children: ReactElement;
  requireProfile?: boolean;
}

export function ProtectedRoute({ children, requireProfile = true }: ProtectedRouteProps): ReactElement {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !profile && location.pathname !== '/setup-nickname') {
    return <Navigate to="/setup-nickname" replace />;
  }

  return children;
}
