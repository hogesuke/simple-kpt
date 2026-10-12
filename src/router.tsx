import { lazy, Suspense } from 'react';
import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { Layout } from '@/components/layout/Layout';
import { PageLoader } from '@/components/layout/PageLoader';

import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

const DemoBoard = lazy(() => import('./pages/DemoBoard').then((m) => ({ default: m.DemoBoard })));
const NewRoom = lazy(() => import('./pages/NewRoom').then((m) => ({ default: m.NewRoom })));
const P2PBoard = lazy(() => import('./pages/P2PBoard').then((m) => ({ default: m.P2PBoard })));
const Privacy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.Privacy })));
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
        path="/new"
        element={
          <Suspense fallback={<PageLoader />}>
            <NewRoom />
          </Suspense>
        }
      />
      <Route
        path="/r/:roomId"
        element={
          <Suspense fallback={<PageLoader />}>
            <P2PBoard />
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
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Route>
  )
);
