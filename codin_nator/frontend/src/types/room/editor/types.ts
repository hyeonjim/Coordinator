// 자동완성 항목
export interface AutoCompleteItem {
  label: string;
  type: "keyword" | "class" | "method" | "snippet";
  insertText?: string;
}

// 현재 입력 중인 단어 정보
export interface WordInfo {
  word: string;
  start: number;
}

// 자동완성 팝업 props
export interface AutoCompletePopupProps {
  items: AutoCompleteItem[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (item: AutoCompleteItem) => void;
}

// 코드 에디터 props
export interface CodeEditorProps {
  roomId: number;
  fileId: number;
  fileName?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;
}
