import type { RoomTerminalProps } from "@/types/room/terminal/types";
import { useTerminal } from "@/hooks/room/terminal/useTerminal";

export default function RoomTerminal(props: RoomTerminalProps) {
  const { containerRef, isOpen, height, toggleTerminal, handleDragStart } =
    useTerminal(props);

  return (
    <>
      <button
        onClick={toggleTerminal}
        className="terminal-toggle-btn"
        title={isOpen ? "터미널 닫기" : "터미널 열기"}
      >
        <span>Terminal</span>
        <span>{isOpen ? "▼" : "▲"}</span>
      </button>

      <div
        onMouseDown={handleDragStart}
        className={`terminal-resize-handle ${isOpen ? "" : "hidden"}`}
      >
        <div className="terminal-resize-icon">≡</div>
      </div>

      <div
        style={{ height: isOpen ? height : 0 }}
        className={`terminal-container transition-all duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="terminal-content">
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>
    </>
  );
}
