import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router-dom';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { KPTBoard } from './pages/KPTBoard';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { SetupNickname } from './pages/SetupNickname';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/login" element={<Login />} />
      <Route
        path="/setup-nickname"
        element={
          <ProtectedRoute requireProfile={false}>
            <SetupNickname />
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
