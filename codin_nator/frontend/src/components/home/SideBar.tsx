import CreateIcon from "../../assets/icons/CreateIcon";
import MyPageIcon from "../../assets/icons/MyPageIcon";
import SettingIcon from "../../assets/icons/SettingIcon";
import Tab from "./Tab";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSidebarStore } from "../../stores/sidebarStore";

export default function SideBar() {
  const location = useLocation();
  const setActivePath = useSidebarStore((s) => s.setActivePath);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname, setActivePath]);

  return (
    <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-16 bg-card border-r flex flex-col items-center py-4 gap-2">
      <Tab to="" icon={<MyPageIcon className="w-10 h-10 mb-4" />} />
      <Tab to="/create" icon={<CreateIcon className="w-10 h-10 mb-4" />} />
      <Tab to="/settings" icon={<SettingIcon className="w-10 h-10" />} />
    </aside>
  );
}
