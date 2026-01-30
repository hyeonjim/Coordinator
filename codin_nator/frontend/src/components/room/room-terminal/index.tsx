import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

import type { TerminalProps } from "../../../types/terminal/types";
import { DEFAULT_TERMINAL_STATUS } from "../../../types/terminal/types";

export default function FakeTerminal({
  projectName,
  branchName,
  userName,
  command,
  output,
  status = DEFAULT_TERMINAL_STATUS,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  /** 터미널 크기 자동 조절을 위한 FitAddon */
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Effect 1: 터미널 초기화
  /**
   * 컴포넌트 마운트 시 터미널을 초기화합니다.
   *
   * 실행 순서:
   * 1. Terminal 인스턴스 생성 (테마, 폰트 등 설정)
   * 2. FitAddon 로드 (화면 크기에 맞게 자동 조절)
   * 3. DOM에 터미널 마운트
   * 4. 초기 프롬프트 출력 (프로젝트명, 브랜치명, 명령어)
   * 5. 리사이즈 이벤트 리스너 등록
   *
   * 의존성: projectName, branchName, userName, command
   * - 이 값들이 변경되면 터미널을 새로 생성합니다.
   */
  useEffect(() => {
    // 컨테이너가 없거나 이미 터미널이 생성되었으면 중복 생성 방지
    if (!containerRef.current || termRef.current) return;
    // 1. Terminal 인스턴스 생성
    const term = new Terminal({
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
      scrollback: 5000, // 스크롤 가능한 최대 라인 수
    });

    // 2. FitAddon 로드 (터미널 크기 자동 조절)
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 3. DOM에 터미널 마운트
    term.open(containerRef.current);
    fitAddon.fit(); // 현재 컨테이너 크기에 맞춤

    // Ref에 저장 (다른 곳에서 사용하기 위해)
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // 4. 초기 프롬프트 출력
    // ANSI 색상 코드: \x1b[32m (초록), \x1b[34m (파랑), \x1b[0m (리셋)
    const prompt = `\x1b[32m${projectName}\x1b[0m (\x1b[34m${branchName}\x1b[0m) [${userName}] ${command}`;
    term.writeln(prompt);
    term.writeln(""); // 빈 줄로 구분

    // 5. 윈도우 리사이즈 이벤트 처리
    const handleResize = () => {
      fitAddon.fit(); // 새로운 크기에 맞게 터미널 조절
    };
    window.addEventListener("resize", handleResize);

    // 정리(cleanup) 함수: 컴포넌트 언마운트 시 실행
    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose(); // 터미널 리소스 해제
      termRef.current = null;
    };
  }, [projectName, branchName, userName, command]);

  // Effect 2: 출력 내용 업데이트

  /**
   * output prop이 변경될 때마다 터미널에 내용을 출력합니다.
   * 실행 순서:
   * 1. output을 줄 단위로 분리 (\n 기준)
   * 2. 각 줄을 터미널에 출력
   * 3. 스크롤을 최하단으로 이동
   *
   * 의존성: output
   * - output이 변경될 때마다 새로운 내용이 추가됩니다.
   *
   * 참고: 현재는 output이 변경될 때마다 내용을 추가합니다.
   * 만약 기존 내용을 지우고 새로 표시하려면 term.clear()를 사용하세요.
   */
  useEffect(() => {
    if (!termRef.current || !output) return;

    // output을 줄 단위로 분리하여 출력
    const lines = output.split("\n");
    lines.forEach((line: string) => termRef.current?.writeln(line));

    // 스크롤을 항상 최하단으로 이동 (최신 출력 내용이 보이도록)
    termRef.current.scrollToBottom();
  }, [output]);

  // 렌더링

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] overflow-hidden">
      {/* 터미널 영역 (flex-1로 남은 공간 모두 차지) */}
      <div className="flex-1 min-h-0 bg-[#1e1e1e] p-2">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* 하단 상태바 */}
      {/* <div className="flex h-6 w-full items-center justify-between bg-[#3b82f6] px-3 text-[11px] text-white select-none"> */}
      {/* 왼쪽: 언어 및 인코딩 정보 */}
      {/* <div className="flex items-center gap-4"> */}
      {/* 언어 표시 */}
      {/* <div className="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer transition-colors">
            <span>{status.language}</span>
          </div> */}

      {/* 인코딩 표시 */}
      {/* <div className="hover:bg-white/20 px-1 rounded cursor-pointer transition-colors">
            {status.encoding}
          </div>
        </div> */}

      {/* 오른쪽: 커서 위치 정보 */}
      {/* <div className="flex items-center gap-4">
          <div className="hover:bg-white/20 px-1 rounded cursor-pointer transition-colors">
            {status.cursorInfo}
          </div>
        </div>
      </div> */}
    </div>
  );
}
