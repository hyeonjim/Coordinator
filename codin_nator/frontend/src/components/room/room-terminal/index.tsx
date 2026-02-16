/**
 * RoomTerminal - 터미널 래퍼 컴포넌트 (열기/닫기 + 크기 조절)
 *
 * [React 기초 - 커스텀 훅으로 로직 분리]
 * - useTerminal 훅이 터미널의 모든 로직(열기/닫기, 높이 조절, xterm.js 관리)을 담당
 * - 컴포넌트는 UI만 담당 → 관심사 분리(Separation of Concerns)
 *
 * [React 기초 - useRef]
 * - containerRef: 터미널이 렌더링될 DOM 요소 참조
 * - <div ref={containerRef} />로 실제 DOM 요소와 연결
 *
 * [사용된 기술]
 * - onMouseDown={handleDragStart}: 드래그로 터미널 높이 조절
 * - 조건부 클래스: isOpen에 따라 표시/숨김 스타일 적용
 */
import type { RoomTerminalProps } from "@/types/terminal";
import { useTerminal } from "@/hooks/room/terminal/useTerminal";

export default function RoomTerminal(props: RoomTerminalProps) {
  // 커스텀 훅에서 상태와 핸들러를 모두 받아옴
  const { containerRef, isOpen, height, toggleTerminal, handleDragStart } =
    useTerminal(props);

  return (
    <>
      <button
        onClick={toggleTerminal}
        className="px-3 py-1 text-xs flex items-center gap-2 bg-(--rc-term-btn-bg) text-(--rc-term-btn-text) border border-(--rc-term-btn-border) border-b-0 rounded-t hover:bg-(--rc-term-btn-hover) transition-all duration-150"
        title={isOpen ? "터미널 닫기" : "터미널 열기"}
      >
        <span>Terminal</span>
        <span>{isOpen ? "▼" : "▲"}</span>
      </button>

      <div
        onMouseDown={handleDragStart}
        className={`relative h-1 cursor-row-resize flex items-center justify-center bg-(--rc-term-resize-bg) hover:bg-(--rc-term-resize-hover) ${isOpen ? "" : "hidden"}`}
      >
        <div className="opacity-0 transition text-xs select-none pointer-events-none text-(--rc-term-resize-icon) group-hover:opacity-100">≡</div>
      </div>

      <div
        style={{ height: isOpen ? height : 0 }}
        className={`flex flex-col overflow-hidden transition-all duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex-1 overflow-auto">
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>
    </>
  );
}
