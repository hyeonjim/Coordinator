interface TabProps {
  to: "/home/mypage" | "/home/create" | "/home/settings";
  icon: React.ReactNode;
}

interface SidebarState {
  activePath: string;
  setActivePath: (path: string) => void;
}
