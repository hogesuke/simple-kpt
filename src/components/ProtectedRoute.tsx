import { ReactElement, useEffect } from 'react';
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
  const isLoadingProfile = useAuthStore((state) => state.isLoadingProfile);
  const loadProfile = useAuthStore((state) => state.loadProfile);
  const location = useLocation();

  // userが存在するがprofileがない場合、プロファイルを再読み込みする（pnpm run devでセッション復帰後などの対策）
  // requireProfile=falseの場合はプロファイルが必須ではないため、再読み込みしない
  useEffect(() => {
    if (requireProfile && user && !profile && !isLoadingProfile && !loading) {
      loadProfile();
    }
  }, [requireProfile, user, profile, isLoadingProfile, loading, loadProfile]);

  if (loading || isLoadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireProfile && !profile && location.pathname !== '/setup-nickname') {
    return <Navigate to="/setup-nickname" state={{ from: location.pathname }} replace />;
  }

  return children;
}
