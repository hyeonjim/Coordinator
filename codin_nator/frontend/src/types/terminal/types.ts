/**
 * 터미널 상태바 정보
 */
export interface TerminalStatus {
  language: string;
  encoding: string;
  connectedUsers: number;
  cursorInfo: string;
}

/**
 * 기본 터미널 디스플레이 컴포넌트 Props (xterm만 담당)
 */
export interface TerminalDisplayProps {
  projectName: string;
  branchName: string;
  userName: string;
  command: string;
  output: string;
}

/**
 * RoomTerminal 컴포넌트 Props (전체 터미널 기능 포함)
 * - 토글, 드래그, xterm 모두 관리
 * - 모든 필드가 선택적이며, 제공되지 않으면 내부에서 기본값 사용
 */
export interface RoomTerminalProps {
  /** 사용자 이름 (선택적, 자동 생성) */
  userName?: string;
  /** 프로젝트 이름 (선택적, 기본값: "codin_nator") */
  projectName?: string;
  /** 브랜치 이름 (선택적, 기본값: "main") */
  branchName?: string;
  /** 실행 명령어 (선택적, 기본값: "npm test") */
  command?: string;
  /** 터미널 출력 내용 (선택적, 기본 샘플 데이터) */
  output?: string;
  /** 초기 높이 (선택적, 기본값: DEFAULT_HEIGHT) */
  initialHeight?: number;
  /** 초기 열림 상태 (선택적, 기본값: true) */
  initialIsOpen?: boolean;
}

/**
 * 터미널 드래그 관련 상수
 */
export const TERMINAL_CONSTRAINTS = {
  /** 최소 높이 (픽셀) */
  MIN_HEIGHT: 0,
  /** 최대 높이 (픽셀) */
  MAX_HEIGHT: 500,
  /** 기본 높이 (픽셀) */
  DEFAULT_HEIGHT: 205,
} as const;

export const DEFAULT_TERMINAL_STATUS: TerminalStatus = {
  language: "Java",
  encoding: "UTF-8",
  connectedUsers: 0,
  cursorInfo: "Ln 1, Col 1",
};
