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
  fileContent?: string;
  fileName?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;
}

// 폰트 크기 조절 props
export interface FontSizeControlProps {
  fontSize: number;
  minFontSize: number;
  maxFontSize: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
}

// AI 테스트 기능 props
export interface AiActionsProps {
  roomId: number;
  fileName?: string;
  code: string;
  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;
}

// 코드 에디터 헤더 props
export interface CodeEditorHeaderProps {
  fileName?: string;
  fontSizeProps: FontSizeControlProps;
  aiActionsProps: AiActionsProps;
}
