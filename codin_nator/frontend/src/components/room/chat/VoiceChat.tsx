import type {
  MicIconProps,
  AvatarProps,
  ParticipantRowProps,
} from "@/types/room/chat/voicechat/types";
import { useRoomContext } from "@/hooks/room/useRoomContext";

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
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {/* 말하는 중이면 아바타 테두리 강조 */}
        <div
          className={`
            relative rounded-full p-0.5 transition-all duration-100 shrink-0 border-2
            ${
              isSpeaking
                ? "border-[#76b976] speaking-glow"
                : "border-transparent"
            }
          `}
        >
          <Avatar name={name} imageUrl={imageUrl} />
        </div>
        <span className="participant-name">{name}</span>
      </div>

      {/* 오른쪽: 마이크 상태 */}
      <button
        onClick={(event) => {
          event.stopPropagation();
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
                ? "text-[#5fad5f]"
                : "text-[#414349]"
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
export function VoiceChat() {
  const {
    participants,
    userId,
    handleToggleMic,
    togglePeerMute,
    isPeerMuted,
  } = useRoomContext();

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
        {participants.map((participant) => (
          <ParticipantRow
            key={participant.userId}
            name={participant.userName}
            imageUrl={participant.imageUrl}
            micOn={participant.micOn}
            isSpeaking={participant.isSpeaking}
            isMe={participant.userId === userId}
            isRemoteMuted={participant.userId !== userId && isPeerMuted(participant.userId)}
            onToggle={() =>
              participant.userId === userId
                ? handleToggleMic()
                : togglePeerMute(participant.userId)
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
