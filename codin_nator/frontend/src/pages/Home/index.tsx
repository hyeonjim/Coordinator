import { Outlet } from "react-router-dom";
import SideBar from "../../components/home/SideBar";
import Header from "../../components/home/Header";

export default function HomeLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <SideBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
