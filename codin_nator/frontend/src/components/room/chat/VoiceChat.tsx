import type {
  VoiceChatProps,
  MicIconProps,
  AvatarProps,
  ParticipantRowProps,
} from "@/types/chat/voicetypes";
import { DebugPanel } from "@/components/room/DebugPanel";

/**
 * 마이크 아이콘 컴포넌트
 */
function MicIcon({ on, isPeerMuted }: MicIconProps) {
  if (isPeerMuted) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }

  if (on) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 5a3 3 0 0 1 6 1v5a3 3 0 0 1-.17 1" />
      <path d="M19 11a7 7 0 0 1-9 6.71" />
      <path d="M5 11a7 7 0 0 0 11.5 5.5" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

/**
 * 사용자 아바타 (이미지 우선, 없을 경우 이름 첫 글자)
 */
function Avatar({ name, imageUrl }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div
      className={`
        h-10 w-10 shrink-0 rounded-full bg-slate-100 text-slate-700 
        flex items-center justify-center font-semibold overflow-hidden border border-slate-200
      `}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

/**
 * 개별 참여자 표시 행
 */
function ParticipantRow({
  name,
  imageUrl,
  micOn,
  isSpeaking,
  isMe,
  isRemoteMuted,
  onToggle,
}: ParticipantRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1 py-1 hover:bg-slate-50 transition-colors group">
      {/* 왼쪽: 아바타 + 이름 */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {/* 말하는 중이면 아바타 테두리 강조 */}
        <div
          className={`
            relative rounded-full p-[2px] transition-all duration-300 shrink-0 border-2
            ${
              isSpeaking
                ? "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                : "border-transparent"
            }
          `}
        >
          <Avatar name={name} imageUrl={imageUrl} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span className="truncate text-[14px] font-semibold text-slate-800 leading-tight">
              {name}
            </span>
            {isMe && (
              <span className="shrink-0 rounded-md bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                host
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 마이크 상태 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`
          flex items-center pl-3 group transition-opacity cursor-pointer 
          hover:bg-slate-100 rounded-lg py-1 px-1
          ${isRemoteMuted ? "opacity-50" : "opacity-100"}
        `}
      >
        <span
          className={`
            transition-colors
            ${
              isRemoteMuted
                ? "text-rose-500"
                : micOn
                  ? "text-emerald-500"
                  : "text-slate-400"
            }
          `}
        >
          <MicIcon on={micOn} isPeerMuted={isRemoteMuted} />
        </span>
        <span
          className={`
            text-[11px] font-bold transition-colors w-9 text-center
            ${
              isRemoteMuted
                ? "text-rose-600"
                : micOn
                  ? "text-emerald-600"
                  : "text-slate-400"
            }
          `}
        >
          {isRemoteMuted ? "MUTED" : micOn ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}

/**
 * 음성 채팅 컴포넌트
 */
export function VoiceChat({
  participants,
  myUserId,
  onToggleMic,
  onTogglePeerMute,
  isPeerMuted,
  testHelpers,
  isWebSocketConnected,
}: VoiceChatProps) {
  return (
    <div className="rounded-xl flex flex-col h-full bg-white shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2 p-3 pb-0">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          참여자 목록
        </h2>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full text-[10px] text-slate-500 font-bold border border-slate-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{participants.length}명 접속</span>
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto flex-1 p-2 pt-1 custom-scrollbar">
        {participants.map((p) => (
          <ParticipantRow
            key={p.userId}
            name={p.userName}
            imageUrl={p.imageUrl}
            micOn={p.micOn}
            isSpeaking={p.isSpeaking}
            isMe={p.userId === myUserId}
            isRemoteMuted={p.userId !== myUserId && isPeerMuted(p.userId)}
            onToggle={() =>
              p.userId === myUserId ? onToggleMic() : onTogglePeerMute(p.userId)
            }
          />
        ))}
        {participants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
            <p className="text-sm font-medium text-slate-500">
              참여자가 없습니다
            </p>
          </div>
        )}
      </div>

      {import.meta.env.DEV && testHelpers && (
        <div className="border-t border-slate-100 p-2">
          <DebugPanel
            onTestUserJoin={testHelpers.simulateTestUserJoin}
            onTestUserMessage={testHelpers.simulateTestUserMessage}
            onSimulateAudio={testHelpers.simulateIncomingAudio}
            isWebSocketConnected={isWebSocketConnected}
          />
        </div>
      )}
    </div>
  );
}
