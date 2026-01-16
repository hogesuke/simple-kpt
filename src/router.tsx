import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AccountSettings } from './pages/AccountSettings';
import { DemoBoard } from './pages/DemoBoard';
import { Home } from './pages/Home';
import { KPTBoard } from './pages/KPTBoard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Privacy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<DemoBoard />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/account"
        element={
          <ProtectedRoute requireProfile={false}>
            <AccountSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards/:boardId"
        element={
          <ProtectedRoute>
            <KPTBoard />
          </ProtectedRoute>
        }
      />
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Route>
  )
);
