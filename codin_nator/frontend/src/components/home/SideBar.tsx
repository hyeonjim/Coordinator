import Tab from "./Tab";

export default function SideBar() {
  return (
    <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-16 bg-card border-r flex flex-col items-center py-4 gap-2">
      <Tab to="/home/mypage" label="마이페이지" />
      <Tab to="/home/create" label="방 만들기" />
      <Tab to="/home/settings" label="설정" />
    </aside>
  );
}
