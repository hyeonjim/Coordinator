import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/Landing";
import RoomPage from "./pages/Room";
import SettingPage from "./pages/Home/tabs/SettingTab";
import RoomCreatePage from "./pages/Home/tabs/CreateRoomTab";
import MyPage from "./pages/Home/tabs/MyPageTab";
import HomeLayout from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/home" element={<HomeLayout />}>
          <Route index element={<MyPage />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="create" element={<RoomCreatePage />} />
          <Route path="settings" element={<SettingPage />} />
        </Route>

        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}
