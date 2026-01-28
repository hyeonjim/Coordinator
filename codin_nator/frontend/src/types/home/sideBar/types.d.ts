interface TabProps {
  to: string;
  icon: React.ReactNode;
}

interface SidebarState {
  activePath: string;
  setActivePath: (path: string) => void;
}
