import CreateIcon from "@/assets/icons/CreateIcon";
import MyPageIcon from "@/assets/icons/MyPageIcon";
import SettingIcon from "@/assets/icons/SettingIcon";
import Tab from "./Tab";

export default function SideBar() {
  return (
    <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-16 bg-card border-r flex flex-col items-center py-4 gap-2">
      <Tab to="/home/mypage" icon={<MyPageIcon className="w-10 h-10 mb-4" />} />
      <Tab to="/home/create" icon={<CreateIcon className="w-10 h-10 mb-4" />} />
      <Tab to="/home/settings" icon={<SettingIcon className="w-10 h-10" />} />
    </aside>
  );
}
