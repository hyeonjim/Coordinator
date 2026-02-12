import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

import PublicRoute from "./components/routes/PublicRoute";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import { bootstrapAuth } from "./auth/bootstrapAuth";

const LandingPage = lazy(() => import("./pages/Landing"));
const RoomPage = lazy(() => import("./pages/Room"));
const HomeLayout = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  useEffect(() => {
    bootstrapAuth();
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomeLayout />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
