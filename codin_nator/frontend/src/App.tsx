import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";

import PublicRoute from "./components/routes/PublicRoute";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import { bootstrapAuth } from "./auth/bootstrapAuth";
import LoadingPage from "./components/common/Loading";

const LandingPage = lazy(() => import("./pages/Landing"));
const RoomPage = lazy(() => import("./pages/Room"));
const HomeLayout = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await bootstrapAuth();
      setIsInitializing(false);
    };

    init();
  }, []);

  if (isInitializing) {
    return <LoadingPage />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
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
