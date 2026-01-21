import Tab from "./Tab";

export default function SideBar() {
  return (
    <div>
      <Tab to="/home/mypage" label="마이페이지" />
      <Tab to="/home/create" label="방 만들기" />
      <Tab to="/home/settings" label="설정" />
    </div>
  );
}
