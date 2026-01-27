import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

// 🔹 상태바에 들어갈 정보 타입 정의
interface TerminalStatus {
  language: string; // 예: Java, React...
  encoding: string; // 예: UTF-8
  connectedUsers: number; // 예: 2
  cursorInfo: string; // 예: Ln 1, Col 1 과연 이거 가능할것인가!
}

interface FakeVscodeTerminalProps {
  projectName: string;
  branchName: string;
  userName: string;
  command: string;
  output: string;
  status?: TerminalStatus; // 상태바 정보는 선택적(Optional)으로 받음
}

export default function FakeTerminal({
  projectName,
  branchName,
  userName,
  command,
  output,
  status = {
    language: "Java",
    encoding: "UTF-8",
    connectedUsers: 0,
    cursorInfo: "Ln 1, Col 1",
  }, // 기본값 설정
}: FakeVscodeTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // 1. 터미널 초기화 (마운트 시 1회 실행)
  useEffect(() => {
    if (!containerRef.current) return;

    // 이미 생성된 경우 중복 생성 방지
    if (termRef.current) return;

    const term = new Terminal({
      disableStdin: true, // 입력 막기 (추후 필요시 false로 변경)
      cursorBlink: false,
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#00000000",
        selectionBackground: "#3a3d41",
      },
      fontFamily: `
        Cascadia Code,
        Menlo,
        Monaco,
        Consolas,
        "Courier New",
        monospace
      `,
      fontSize: 14,
      lineHeight: 1.4,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // 🔹 Header line (초기 커맨드 표시)
    // 색상 코드를 사용하여 프롬프트 꾸미기 (ANSI Color)
    // \x1b[32m(Green) \x1b[34m(Blue) \x1b[0m(Reset)
    const prompt = `\x1b[32m${projectName}\x1b[0m (\x1b[34m${branchName}\x1b[0m) [${userName}] ${command}`;
    term.writeln(prompt);
    term.writeln(""); // 빈 줄 추가

    // 리사이즈 이벤트 대응
    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      termRef.current = null;
    };
  }, [projectName, branchName, userName, command]);

  // 2. Output 데이터 감지 및 업데이트 (서버 통신 대비)
  // output prop이 변경될 때마다 터미널에 내용을 씁니다.
  useEffect(() => {
    if (!termRef.current || !output) return;

    // 기존 내용을 지우고 새로 쓸지, 이어서 쓸지는 정책에 따라 결정
    // 여기서는 줄바꿈으로 구분하여 한 줄씩 출력하도록 처리
    const lines = output.split("\n");
    lines.forEach((line) => termRef.current?.writeln(line));

    // 스크롤을 항상 최하단으로 이동
    termRef.current.scrollToBottom();
  }, [output]);

  return (
    // 전체 컨테이너: flex-col로 상단(터미널)과 하단(상태바) 분리
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 터미널 영역 (남은 공간 모두 차지) */}
      <div className="flex-1 min-h-0 bg-[#1e1e1e] p-2">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* 하단 상태바 (Blue Bar) */}
      <div className="flex h-6 w-full items-center justify-between bg-[#3b82f6] px-3 text-[11px] text-white select-none">
        {/* 왼쪽: 언어, 인코딩 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer transition-colors">
            {/* 아이콘이 필요하면 여기에 추가 (예: {} 모양) */}
            <span>{status.language}</span>
          </div>
          <div className="hover:bg-white/20 px-1 rounded cursor-pointer transition-colors">
            {status.encoding}
          </div>
        </div>

        {/* 오른쪽: 커서 위치 */}
        <div className="flex items-center gap-4">
          <div className="hover:bg-white/20 px-1 rounded cursor-pointer transition-colors">
            {status.cursorInfo}
          </div>
        </div>
      </div>

      <style>{`
        /* xterm 내부 스크롤바 스타일링 */
        .xterm-viewport::-webkit-scrollbar {
          width: 10px;
        }
        .xterm-viewport::-webkit-scrollbar-thumb {
          background-color: #424242;
          border-radius: 4px;
        }
        .xterm-viewport::-webkit-scrollbar-thumb:hover {
          background-color: #4f4f4f;
        }
      `}</style>
    </div>
  );
}
