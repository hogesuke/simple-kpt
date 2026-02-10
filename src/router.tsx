import { lazy, Suspense } from 'react';
import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { PageLoader } from '@/components/layout/PageLoader';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

const AccountSettings = lazy(() => import('./pages/AccountSettings').then((m) => ({ default: m.AccountSettings })));
const DemoBoard = lazy(() => import('./pages/DemoBoard').then((m) => ({ default: m.DemoBoard })));
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const KPTBoard = lazy(() => import('./pages/KPTBoard').then((m) => ({ default: m.KPTBoard })));
const Privacy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.Privacy })));
const SignUp = lazy(() => import('./pages/SignUp').then((m) => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Landing />} />
      <Route
        path="/demo"
        element={
          <Suspense fallback={<PageLoader />}>
            <DemoBoard />
          </Suspense>
        }
      />
      <Route
        path="/terms"
        element={
          <Suspense fallback={<PageLoader />}>
            <Terms />
          </Suspense>
        }
      />
      <Route
        path="/privacy"
        element={
          <Suspense fallback={<PageLoader />}>
            <Privacy />
          </Suspense>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<PageLoader />}>
            <SignUp />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<PageLoader />}>
            <ForgotPassword />
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<PageLoader />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute requireProfile={false}>
            <Suspense fallback={<PageLoader />}>
              <AccountSettings />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards/:boardId"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <KPTBoard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Route>
  )
);
