/**
 * useTerminal.ts - xterm.js 기반 터미널 에뮬레이터 훅
 *
 * [이 훅의 역할]
 * - xterm.js 라이브러리를 사용하여 브라우저 내 터미널 UI를 제공
 * - 코드 실행 결과를 터미널 형태로 출력
 * - 드래그로 터미널 높이 조절 가능
 * - 자동 리사이즈 (ResizeObserver 사용)
 *
 * [xterm.js란?]
 * - 브라우저에서 동작하는 터미널 에뮬레이터 라이브러리
 * - VS Code의 내장 터미널도 xterm.js를 사용
 * - Terminal: 핵심 터미널 인스턴스 (writeln으로 출력, open으로 DOM에 마운트)
 * - FitAddon: 컨테이너 크기에 맞게 터미널을 자동 조절하는 애드온
 *
 * [useRef 사용 패턴]
 * - containerRef: 터미널이 마운트될 DOM 요소 참조
 * - terminalRef: xterm.js Terminal 인스턴스 (리렌더링과 무관하게 유지)
 * - isDraggingRef: 드래그 상태 추적 (리렌더링 없이 빠르게 갱신)
 *
 * [ResizeObserver]
 * - DOM 요소의 크기 변경을 감지하는 브라우저 API
 * - 터미널 컨테이너 크기가 바뀌면 fitAddon.fit()으로 터미널 재조정
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

import { useRoomContext } from "@/hooks/room/useRoomContext";
import type {
  RoomTerminalProps,
  TerminalConfig,
  TerminalPromptInfo,
} from "@/types/terminal";

const TERMINAL_MIN_HEIGHT = 0;
const TERMINAL_MAX_HEIGHT = 500;
const TERMINAL_DEFAULT_HEIGHT = 205;

const DEFAULT_PROJECT_NAME = "codin_nator";
const DEFAULT_BRANCH_NAME = "main";
const DEFAULT_COMMAND = "npm test";

const DEFAULT_TERMINAL_CONFIG: TerminalConfig = {
  disableStdin: true,
  cursorBlink: false,
  theme: {
    background: "#0A080D",
    foreground: "#DCD8D8",
    cursor: "#00000000",
    selectionBackground: "#2F363F",
  },
  fontFamily: `Cascadia Code, Menlo, Monaco, Consolas, "Courier New", monospace`,
  fontSize: 14,
  lineHeight: 1.4,
  scrollback: 5000,
  convertEol: true,
};

function generateUserId(): string {
  return `user_${Math.random().toString(36).slice(2, 10)}`;
}

export function useTerminal(options: RoomTerminalProps = {}) {
  const {
    testCode,
    userName: userNameProperty,
    projectName: projectNameProperty,
    branchName: branchNameProperty,
    command: commandProperty,
    initialHeight = TERMINAL_DEFAULT_HEIGHT,
    initialIsOpen = true,
  } = options;

  const { terminalOutput } = useRoomContext();

  const generatedUserId = useMemo(() => generateUserId(), []);
  const generatedUserName = useMemo(
    () => `사용자_${generatedUserId.slice(-4)}`,
    [generatedUserId],
  );

  const promptInfo: TerminalPromptInfo = useMemo(
    () => ({
      userName: userNameProperty ?? generatedUserName,
      projectName: projectNameProperty ?? DEFAULT_PROJECT_NAME,
      branchName: branchNameProperty ?? DEFAULT_BRANCH_NAME,
      command: commandProperty ?? DEFAULT_COMMAND,
    }),
    [
      userNameProperty,
      generatedUserName,
      projectNameProperty,
      branchNameProperty,
      commandProperty,
    ],
  );

  const output = testCode ?? terminalOutput ?? "";

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [height, setHeight] = useState<number>(initialHeight);

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  /**
   * 터미널 초기화 (컴포넌트 마운트 시 1회)
   * - Terminal 인스턴스 생성 및 DOM에 연결
   * - FitAddon을 로드하여 컨테이너 크기에 맞게 자동 조절
   * - 프롬프트(사용자명, 프로젝트명, 브랜치명, 명령어)를 출력
   * - cleanup에서 terminal.dispose()로 리소스 해제
   *
   * [requestAnimationFrame]
   * - 브라우저의 다음 화면 갱신 시점에 콜백을 실행하는 API
   * - 여기서는 DOM이 완전히 렌더링된 후에 fit()을 호출하기 위해 2중 RAF 사용
   */
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    const terminal = new Terminal(DEFAULT_TERMINAL_CONFIG);
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (containerRef.current && fitAddon) {
            fitAddon.fit();
          }
        } catch (error) {
          console.warn("Terminal fit 실패 (초기화 중):", error);
        }
      });
    });

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const { projectName, branchName, userName, command } = promptInfo;
    const prompt = `\x1b[32m${projectName}\x1b[0m (\x1b[34m${branchName}\x1b[0m) [${userName}] ${command}`;
    terminal.writeln(prompt);
    terminal.writeln("");

    return () => {
      terminal.dispose();
      terminalRef.current = null;
    };
  }, [promptInfo]);

  /**
   * 출력 내용이 변경되면 터미널에 표시
   * - output(코드 실행 결과)가 바뀔 때마다 줄 단위로 터미널에 출력
   * - scrollToBottom()으로 최신 출력이 보이도록 자동 스크롤
   */
  useEffect(() => {
    if (!terminalRef.current || !output) return;

    const lines = output.split("\n");
    lines.forEach((line: string) => {
      terminalRef.current?.writeln(line);
    });

    terminalRef.current.scrollToBottom();
  }, [output]);

  useEffect(() => {
    if (!containerRef.current || !fitAddonRef.current) return;

    const observer = new ResizeObserver(() => {
      try {
        fitAddonRef.current?.fit();
        terminalRef.current?.scrollToBottom();
      } catch (error) {
        console.warn("Terminal ResizeObserver fit 실패:", error);
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  /**
   * 터미널 높이 드래그 조절
   * - 마우스 다운 → 드래그 시작, 전역 mousemove/mouseup 리스너 등록
   * - 마우스 이동 → 높이 실시간 갱신 (최소/최대 범위 내)
   * - 마우스 업 → 드래그 종료, 리스너 해제
   *
   * [이벤트 위임 패턴]
   * - mousemove/mouseup은 window에 등록 (드래그 중 마우스가 요소 밖으로 나가도 동작)
   * - cleanup에서 반드시 removeEventListener로 해제 (메모리 누수 방지)
   */
  const handleDragStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      startYRef.current = event.clientY;
      startHeightRef.current = height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaY = startYRef.current - moveEvent.clientY;
        const newHeight = startHeightRef.current + deltaY;
        const constrainedHeight = Math.max(
          TERMINAL_MIN_HEIGHT,
          Math.min(TERMINAL_MAX_HEIGHT, newHeight),
        );
        setHeight(constrainedHeight);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [height],
  );

  const toggleTerminal = useCallback(() => {
    setIsOpen((previous) => !previous);
  }, []);

  return {
    containerRef,
    isOpen,
    height,
    toggleTerminal,
    handleDragStart,
  };
}
