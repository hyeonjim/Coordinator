import type {
  VoiceChatProps,
  MicIconProps,
  AvatarProps,
  ParticipantRowProps,
} from "@/types/chat/voicetypes";

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
    <div className="participant-avatar">
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
  isRemoteMuted,
  onToggle,
}: ParticipantRowProps) {
  return (
    <div className="participant-row group">
      {/* 왼쪽: 아바타 + 이름 */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {/* 말하는 중이면 아바타 테두리 강조 */}
        <div
          className={`
            relative rounded-full p-[2px] transition-all duration-300 shrink-0 border-2
            ${
              isSpeaking
                ? "border-[#7F838D] speaking-glow"
                : "border-transparent"
            }
          `}
        >
          <Avatar name={name} imageUrl={imageUrl} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="participant-name">{name}</span>
        </div>
      </div>

      {/* 오른쪽: 마이크 상태 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`participant-mic-btn ${isRemoteMuted ? "opacity-50" : "opacity-100"}`}
      >
        <span
          className={
            isRemoteMuted
              ? "mic-icon-muted"
              : micOn
                ? "mic-icon-on"
                : "mic-icon-off"
          }
        >
          <MicIcon on={micOn} isPeerMuted={isRemoteMuted} />
        </span>
        <span
          className={`mic-status-text ${
            isRemoteMuted
              ? "text-[#d87a7a]"
              : micOn
                ? "text-[#7ba87b]"
                : "text-[#7F838D]"
          }`}
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
}: VoiceChatProps) {
  return (
    <div className="voice-chat-container">
      <div className="voice-chat-header">
        <h2 className="voice-chat-title">참여자 목록</h2>
        <div className="voice-chat-status">
          <span className="voice-chat-status-dot"></span>
          <span>{participants.length}명 접속</span>
        </div>
      </div>

      <div className="voice-chat-participants room-scrollbar">
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
          <div className="voice-chat-empty">
            <p className="text-sm font-medium">참여자가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
