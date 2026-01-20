import { Outlet } from "react-router-dom";
import SideBar from "../../components/home/SideBar";
import Header from "../../components/home/Header";

export default function HomeLayout() {
  return (
    <div>
      <Header />
      <SideBar />
      <Outlet />
    </div>
  );
}
