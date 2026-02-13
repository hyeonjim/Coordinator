import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

import type {
  RoomTerminalProps,
  TerminalConfig,
  TerminalPromptInfo,
} from "@/types/room/terminal/types";

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
    output: outputProperty,
    testCode,
    userName: userNameProperty,
    projectName: projectNameProperty,
    branchName: branchNameProperty,
    command: commandProperty,
    initialHeight = TERMINAL_DEFAULT_HEIGHT,
    initialIsOpen = true,
  } = options;

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

  const output = testCode ?? outputProperty ?? "";

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [height, setHeight] = useState<number>(initialHeight);

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

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
