import { create } from "zustand";

interface FileClickState {
  clickedFiles: Record<string, number>;
  markClicked: (fileName: string) => void;
  getClickCount: (fileName: string) => number;
}

export const useFileClickStore = create<FileClickState>((set, get) => ({
  clickedFiles: {},
  markClicked: (fileName) =>
    set((state) => ({
      clickedFiles: {
        ...state.clickedFiles,
        [fileName]: (state.clickedFiles[fileName] ?? 0) + 1,
      },
    })),
  getClickCount: (fileName) => get().clickedFiles[fileName] ?? 0,
}));
