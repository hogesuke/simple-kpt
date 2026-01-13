import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AccountSettings } from './pages/AccountSettings';
import { DemoBoard } from './pages/DemoBoard';
import { Home } from './pages/Home';
import { KPTBoard } from './pages/KPTBoard';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/demo" element={<DemoBoard />} />
      <Route
        path="/account"
        element={
          <ProtectedRoute requireProfile={false}>
            <AccountSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/board/:boardId"
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
