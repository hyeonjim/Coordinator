import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/Landing";
import RoomPage from "./pages/Room";
import SettingPage from "./pages/Home/tabs/SettingTab";
import RoomCreatePage from "./pages/Home/tabs/CreateRoomTab";
import MyPage from "./pages/Home/tabs/MyPageTab";
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
          <Route path="/home" element={<HomeLayout />}>
            <Route index element={<Navigate to="mypage" replace />} />
            <Route path="mypage" element={<MyPage />} />
            <Route path="create" element={<RoomCreatePage />} />
            <Route path="settings" element={<SettingPage />} />
          </Route>

          <Route path="/room/:roomId" element={<RoomPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
