/**
 * @file terminal.ts - 터미널(Terminal) 관련 타입 정의
 *
 * xterm.js 기반의 웹 터미널 컴포넌트 타입을 정의합니다.
 *
 * xterm.js:
 * - 브라우저에서 실제 터미널 UI를 렌더링하는 라이브러리
 * - VS Code의 내장 터미널도 xterm.js를 사용합니다
 * - ITheme 인터페이스로 터미널 색상을 커스터마이징할 수 있습니다
 *
 * 통합 출처:
 * - types/room/terminal/types.ts
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 터미널 테마 / 설정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 터미널 테마 설정
 *
 * xterm.js의 ITheme 인터페이스에서 사용하는 주요 색상을 정의합니다.
 * CSS 색상 문자열(hex, rgb 등)을 사용합니다.
 */
export interface TerminalTheme {
  /** 배경색 */
  background: string;

  /** 기본 텍스트 색상 */
  foreground: string;

  /** 커서 색상 */
  cursor: string;

  /** 텍스트 선택 영역 배경색 */
  selectionBackground: string;
}

/**
 * 터미널 설정
 *
 * xterm.js Terminal 인스턴스 생성 시 전달하는 옵션입니다.
 * 읽기 전용 터미널(테스트 결과 출력용)로 사용하므로 disableStdin=true입니다.
 */
export interface TerminalConfig {
  /** 표준 입력 비활성화 (true이면 읽기 전용) */
  disableStdin: boolean;

  /** 커서 깜빡임 여부 */
  cursorBlink: boolean;

  /** 터미널 테마 (색상 설정) */
  theme: TerminalTheme;

  /** 폰트 패밀리 (예: "Fira Code, monospace") */
  fontFamily: string;

  /** 폰트 크기 (px) */
  fontSize: number;

  /** 줄 간격 배수 (1.0 = 기본) */
  lineHeight: number;

  /** 스크롤백 버퍼 크기 (보존할 최대 줄 수) */
  scrollback: number;

  /** EOL(End Of Line) 자동 변환 여부 (\n → \r\n) */
  convertEol: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 터미널 프롬프트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 터미널 프롬프트 정보
 *
 * 터미널 출력 시 프롬프트 라인을 구성하는 정보입니다.
 * 예: "user@project (main) $ mvn test"
 */
export interface TerminalPromptInfo {
  /** 프로젝트 이름 */
  projectName: string;

  /** Git 브랜치 이름 */
  branchName: string;

  /** 사용자 이름 */
  userName: string;

  /** 실행한 명령어 */
  command: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트 Props
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * RoomTerminal 컴포넌트 Props
 *
 * 방 하단에 표시되는 터미널 패널입니다.
 * 테스트 실행 결과를 표시하고, 높이 조절 및 접기/펼치기가 가능합니다.
 */
export interface RoomTerminalProps {
  /** AI가 생성한 테스트 코드 (실행 결과 표시용) */
  testCode?: string | null;

  /** 사용자 이름 (프롬프트 표시용) */
  userName?: string;

  /** 프로젝트 이름 (프롬프트 표시용) */
  projectName?: string;

  /** Git 브랜치 이름 (프롬프트 표시용) */
  branchName?: string;

  /** 실행 명령어 (프롬프트 표시용) */
  command?: string;

  /** 초기 터미널 높이 (px) */
  initialHeight?: number;

  /** 초기 열림/닫힘 상태 */
  initialIsOpen?: boolean;
}
