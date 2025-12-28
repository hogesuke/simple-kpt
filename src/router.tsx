import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { KPTBoard } from './pages/KPTBoard';
import { Login } from './pages/Login';
import { SetupNickname } from './pages/SetupNickname';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
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
    </>
  )
);
