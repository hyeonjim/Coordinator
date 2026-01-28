import { create } from "zustand";

export const useSidebarStore = create<SidebarState>((set) => ({
  activePath: "",
  setActivePath: (path) => set({ activePath: path }),
}));
