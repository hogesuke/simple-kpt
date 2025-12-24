import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { KPTBoard } from './pages/KPTBoard';
import { Login } from './pages/Login';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
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
