import type { RoomTerminalProps } from "@/types/room/terminal/types";
import { useTerminal } from "@/hooks/room/terminal/useTerminal";

export default function RoomTerminal(props: RoomTerminalProps) {
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
