import type { FileClickState } from "@/types/file/types";
import { create } from "zustand";

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
