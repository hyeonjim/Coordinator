interface TabProps {
  to: "" | "/create" | "/settings";
  icon: React.ReactNode;
}

interface SidebarState {
  activePath: string;
  setActivePath: (path: string) => void;
}
