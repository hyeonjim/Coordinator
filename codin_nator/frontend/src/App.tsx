import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/Landing";
import RoomPage from "./pages/Room";
import HomeLayout from "./pages/Home";
import NotFound from "./pages/NotFound";
import PublicRoute from "./components/routes/PublicRoute";
import ProtectedRoute from "./components/routes/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인한 유저는 Landing 못 오게 */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* 로그인 필요 라우트 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomeLayout />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
