import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

import type { RoomTerminalProps } from "../../../types/terminal/types";
import { TERMINAL_CONSTRAINTS } from "../../../types/terminal/types";

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 랜덤 ID 생성 함수
 * @param prefix - ID 접두사 (기본값: "id")
 * @returns 생성된 랜덤 ID
 */
function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// =============================================================================
// 기본 상수
// =============================================================================

/** 기본 프로젝트 이름 */
const DEFAULT_PROJECT_NAME = "codin_nator";

/** 기본 브랜치 이름 */
const DEFAULT_BRANCH_NAME = "main";

/** 기본 실행 명령어 */
const DEFAULT_COMMAND = "npm test";

/** 기본 터미널 출력 (샘플 데이터) */
const DEFAULT_OUTPUT = `PASS  src/App.test.jsx
✓ 화면에 Hello React가 보인다 (32 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total`;

/**
 * RoomTerminal 컴포넌트
 *
 * 터미널의 모든 기능을 포함하는 완전히 독립적인 컴포넌트입니다:
 * - 토글 버튼: 터미널 열기/닫기
 * - 드래그 핸들: 터미널 높이 조절
 * - xterm 터미널: 실제 터미널 화면 표시
 *
 * 모든 props가 선택적이며, 제공되지 않으면 내부에서 자동으로 생성하거나 기본값을 사용합니다.
 *
 * @param userName - 사용자 이름 (선택적, 자동 생성)
 * @param projectName - 프로젝트 이름 (선택적, 기본값: "codin_nator")
 * @param branchName - 브랜치 이름 (선택적, 기본값: "main")
 * @param command - 실행 명령어 (선택적, 기본값: "npm test")
 * @param output - 터미널 출력 내용 (선택적, 기본 샘플 데이터)
 * @param initialHeight - 초기 높이 (선택적, 기본값: DEFAULT_HEIGHT)
 * @param initialIsOpen - 초기 열림 상태 (선택적, 기본값: true)
 */
export default function RoomTerminal({
  userName: userNameProp,
  projectName: projectNameProp,
  branchName: branchNameProp,
  command: commandProp,
  output: outputProp,
  initialHeight = TERMINAL_CONSTRAINTS.DEFAULT_HEIGHT,
  initialIsOpen = true,
}: RoomTerminalProps = {}) {
  // ==========================================================================
  // 사용자 이름 자동 생성
  // ==========================================================================

  /**
   * 자동 생성된 사용자 ID
   * props로 userName이 제공되지 않으면 사용됩니다.
   */
  const generatedUserId = useMemo(() => generateId("user"), []);

  /**
   * 자동 생성된 사용자 이름
   * userId의 마지막 4자리를 사용합니다.
   */
  const generatedUserName = useMemo(
    () => `사용자_${generatedUserId.slice(-4)}`,
    [generatedUserId],
  );

  // ==========================================================================
  // Props 기본값 처리
  // ==========================================================================

  /** 사용자 이름 (props 우선, 없으면 자동 생성) */
  const userName = userNameProp ?? generatedUserName;

  /** 프로젝트 이름 (props 우선, 없으면 기본값) */
  const projectName = projectNameProp ?? DEFAULT_PROJECT_NAME;

  /** 브랜치 이름 (props 우선, 없으면 기본값) */
  const branchName = branchNameProp ?? DEFAULT_BRANCH_NAME;

  /** 실행 명령어 (props 우선, 없으면 기본값) */
  const command = commandProp ?? DEFAULT_COMMAND;

  /** 터미널 출력 (props 우선, 없으면 기본 샘플 데이터) */
  const output = outputProp ?? DEFAULT_OUTPUT;
  // ==========================================================================
  // 상태 관리
  // ==========================================================================

  /** 터미널 열림/닫힘 상태 */
  const [isTerminalOpen, setIsTerminalOpen] = useState(initialIsOpen);

  /** 터미널 높이 (픽셀) */
  const [terminalHeight, setTerminalHeight] = useState<number>(initialHeight);

  /** 드래그 중인지 여부 */
  const isDraggingRef = useRef(false);

  /** 드래그 시작 시 마우스 Y 위치 */
  const startYRef = useRef(0);

  /** 드래그 시작 시 터미널 높이 */
  const startHeightRef = useRef(0);

  // ==========================================================================
  // xterm 터미널 관리
  // ==========================================================================

  /** 터미널 컨테이너 DOM 참조 */
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  /** xterm Terminal 인스턴스 참조 */
  const terminalRef = useRef<Terminal | null>(null);

  /** FitAddon 참조 (터미널 크기 자동 조절) */
  const fitAddonRef = useRef<FitAddon | null>(null);

  // ==========================================================================
  // Effect: 터미널 초기화
  // ==========================================================================

  /**
   * 컴포넌트 마운트 시 xterm 터미널을 초기화합니다.
   *
   * 실행 순서:
   * 1. Terminal 인스턴스 생성 (테마, 폰트 등 설정)
   * 2. FitAddon 로드 (화면 크기에 맞게 자동 조절)
   * 3. DOM에 터미널 마운트
   * 4. 초기 프롬프트 출력 (프로젝트명, 브랜치명, 명령어)
   * 5. 리사이즈 이벤트 리스너 등록
   */
  useEffect(() => {
    // 컨테이너가 없거나 이미 터미널이 생성되었으면 중복 생성 방지
    if (!terminalContainerRef.current || terminalRef.current) return;

    // 1. Terminal 인스턴스 생성
    const terminal = new Terminal({
      disableStdin: true, // 사용자 입력 비활성화 (읽기 전용 터미널)
      cursorBlink: false, // 커서 깜빡임 비활성화
      theme: {
        background: "#1e1e1e", // VSCode 다크 테마 배경색
        foreground: "#d4d4d4", // 기본 텍스트 색상
        cursor: "#00000000", // 투명한 커서 (보이지 않음)
        selectionBackground: "#3a3d41", // 텍스트 선택 시 배경색
      },
      fontFamily: `
        Cascadia Code,
        Menlo,
        Monaco,
        Consolas,
        "Courier New",
        monospace
      `, // VSCode 기본 폰트
      fontSize: 14,
      lineHeight: 1.4,
      scrollback: 5000, // 세로 스크롤 가능한 최대 라인 수
      convertEol: true, // 자동 줄바꿈 활성화 (\n을 \r\n으로 변환)
    });

    // 2. FitAddon 로드 (터미널 크기 자동 조절)
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // 3. DOM에 터미널 마운트
    terminal.open(terminalContainerRef.current);
    fitAddon.fit(); // 현재 컨테이너 크기에 맞춤

    // Ref에 저장 (다른 곳에서 사용하기 위해)
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // 4. 초기 프롬프트 출력
    // ANSI 색상 코드: \x1b[32m (초록), \x1b[34m (파랑), \x1b[0m (리셋)
    const prompt = `\x1b[32m${projectName}\x1b[0m (\x1b[34m${branchName}\x1b[0m) [${userName}] ${command}`;
    terminal.writeln(prompt);
    terminal.writeln(""); // 빈 줄로 구분

    // 5. 윈도우 리사이즈 이벤트 처리
    const handleWindowResize = () => {
      fitAddon.fit(); // 새로운 크기에 맞게 터미널 조절
    };
    window.addEventListener("resize", handleWindowResize);

    // 정리(cleanup) 함수: 컴포넌트 언마운트 시 실행
    return () => {
      window.removeEventListener("resize", handleWindowResize);
      terminal.dispose(); // 터미널 리소스 해제
      terminalRef.current = null;
    };
  }, [projectName, branchName, userName, command]);

  // ==========================================================================
  // Effect: 출력 내용 업데이트
  // ==========================================================================

  /**
   * output prop이 변경될 때마다 터미널에 내용을 출력합니다.
   *
   * 실행 순서:
   * 1. output을 줄 단위로 분리 (\n 기준)
   * 2. 각 줄을 터미널에 출력 (긴 줄은 자동으로 줄바꿈됨)
   * 3. 세로 스크롤을 최하단으로 이동
   */
  useEffect(() => {
    if (!terminalRef.current || !output) return;

    // output을 줄 단위로 분리하여 출력
    const lines = output.split("\n");
    lines.forEach((line: string) => {
      // writeln은 자동으로 줄바꿈을 추가하며,
      // 긴 줄은 터미널 너비에 맞게 자동으로 줄바꿈됩니다.
      terminalRef.current?.writeln(line);
    });

    // 세로 스크롤을 항상 최하단으로 이동 (최신 출력 내용이 보이도록)
    terminalRef.current.scrollToBottom();
  }, [output]);

  // 드래그 핸들링

  /**
   * React.MouseEvent를 사용하여 드래그를 시작하고 전역 이벤트 리스너를 등록합니다.
   */
  const handleDragStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      // 드래그 시작 정보 저장
      isDraggingRef.current = true;
      startYRef.current = event.clientY;
      startHeightRef.current = terminalHeight;

      /**
       * 마우스 이동 핸들러
       * 드래그 중 마우스 Y 위치에 따라 터미널 높이를 조절합니다.
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;

        const deltaY = startYRef.current - moveEvent.clientY;
        const newHeight = startHeightRef.current + deltaY;

        // 최소/최대 높이 제약 조건 적용
        const constrainedHeight = Math.max(
          TERMINAL_CONSTRAINTS.MIN_HEIGHT,
          Math.min(TERMINAL_CONSTRAINTS.MAX_HEIGHT, newHeight),
        );

        setTerminalHeight(constrainedHeight);
      };

      /**
       * 마우스 버튼 해제 핸들러
       * 드래그를 종료하고 이벤트 리스너를 제거합니다.
       */
      const handleMouseUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      // 전역 이벤트 리스너 등록
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [terminalHeight],
  );

  /**
   * 터미널 열기/닫기 토글
   */
  const handleToggleTerminal = useCallback(() => {
    setIsTerminalOpen((previousState) => !previousState);
  }, []);

  // 렌더링

  return (
    <>
      {/* 터미널 토글 버튼 (코드 에디터 하단 우측에 absolute 위치) */}
      <button
        onClick={handleToggleTerminal}
        className="absolute bottom-0 right-4 bg-[#2d2d30] hover:bg-[#3e3e42] text-slate-300 px-1.5 py-0.5 text-xs border border-slate-600 rounded-t transition-colors flex items-center gap-2 z-10"
        title={isTerminalOpen ? "터미널 닫기" : "터미널 열기"}
      >
        <span>Terminal</span>
        <span>{isTerminalOpen ? "▼" : "▲"}</span>
      </button>

      {/* 터미널이 열려있을 때만 표시 */}
      {isTerminalOpen && (
        <>
          {/* 드래그 핸들 */}
          <div
            onMouseDown={handleDragStart}
            className="
              relative
              h-1
              bg-neutral-500
              hover:bg-blue-300
              cursor-row-resize
              flex
              items-center
              justify-center
              group
            "
          >
            <div
              className="
                opacity-0
                group-hover:opacity-100
                transition
                text-blue-300
                text-xs
                select-none
                pointer-events-none
              "
            >
              ≡
            </div>
          </div>

          {/* 터미널 영역 */}
          <div
            style={{ height: terminalHeight }}
            className="border-t border-slate-700 bg-[#1e1e1e] flex flex-col overflow-hidden"
          >
            {/* xterm 터미널 출력 영역 */}
            <div className="flex-1 min-h-0 bg-[#1e1e1e] p-2 overflow-auto">
              <div ref={terminalContainerRef} className="h-full w-full" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
