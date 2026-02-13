/**
 * 터미널 테마 설정
 */
export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
}

/**
 * 터미널 설정
 */
export interface TerminalConfig {
  disableStdin: boolean;
  cursorBlink: boolean;
  theme: TerminalTheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  scrollback: number;
  convertEol: boolean;
}

/**
 * 터미널 프롬프트 정보
 */
export interface TerminalPromptInfo {
  projectName: string;
  branchName: string;
  userName: string;
  command: string;
}

/**
 * RoomTerminal 컴포넌트 Props
 */
export interface RoomTerminalProps {
  testCode?: string | null;
  userName?: string;
  projectName?: string;
  branchName?: string;
  command?: string;
  initialHeight?: number;
  initialIsOpen?: boolean;
}
