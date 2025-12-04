import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { Home } from './pages/Home';
import { KPTBoard } from './pages/KPTBoard';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />}></Route>
      <Route path="/board" element={<KPTBoard />}></Route>
    </>
  )
);
