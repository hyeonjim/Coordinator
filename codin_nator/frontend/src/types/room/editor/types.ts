import type { AutoCompleteItem } from "./javaAutoComplete";

export interface AutoCompletePopupProps {
  items: AutoCompleteItem[]; // 표시할 항목들
  selectedIndex: number; // 현재 선택된 인덱스
  position: { top: number; left: number }; // 팝업 위치
  onSelect: (item: AutoCompleteItem) => void; // 항목 선택 시 콜백
  onClose: () => void; // 팝업 닫기 콜백
}

export interface CodeEditorProps {
  roomId: number;
  fileId: number;
  fileName?: string;
  fileContent?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;
}
