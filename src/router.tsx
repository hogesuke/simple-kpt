import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { Home } from './pages/Home';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />}></Route>
    </>
  )
);
