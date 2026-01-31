import type { DebugPanelProps } from "@/types/room/types";

/**
 * 개발 도구 패널 컴포넌트
 * 개발 환경에서만 표시되며 테스트 기능을 제공합니다.
 */
export function DebugPanel({
  onTestUserJoin,
  onTestUserMessage,
  onSimulateAudio,
  isWebSocketConnected,
}: DebugPanelProps) {
  return (
    <div className="p-2">
      <p className="text-[10px] font-bold text-slate-500 mb-1">🛠️ DEBUG</p>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={onTestUserJoin}
          className="px-1.5 py-0.5 bg-slate-600 text-white text-[10px] rounded hover:bg-slate-700 transition-colors cursor-pointer"
        >
          유저+
        </button>
        <button
          onClick={onTestUserMessage}
          className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 transition-colors cursor-pointer"
        >
          채팅+
        </button>
        <button
          onClick={onSimulateAudio}
          className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded hover:bg-rose-700 transition-colors cursor-pointer"
        >
          상대방 음성확인
        </button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            isWebSocketConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-[10px] text-slate-500">
          {isWebSocketConnected ? "WS Connected" : "WS Disconnected"}
        </span>
      </div>
    </div>
  );
}
