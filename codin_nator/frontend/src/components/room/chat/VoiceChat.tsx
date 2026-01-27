import type { Participant } from "../../../types/chat/types";

interface ParticipantListProps {
  /** 참여자 목록 */
  participants: Participant[];
  /** 현재 사용자 ID (내 표시용) */
  myUserId: string;
  /** 마이크 토글 핸들러 */
  onToggleMic: () => void;
  /** 특정 피어 음소거 토글 핸들러 */
  onTogglePeerMute: (peerId: string) => void;
  /** 피어 음소거 상태 확인 함수 */
  isPeerMuted: (peerId: string) => boolean;
}
// 마이크 on/off
function MicIcon({ on, isPeerMuted }: { on: boolean; isPeerMuted?: boolean }) {
  // 상대방을 내가 음소거한 경우 (우선순위 높음)
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
    // 마이크 ON 아이콘
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

  // 마이크 OFF 아이콘
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
 * 사용자 아바타 (이름의 첫 글자 표시)
 */
function Avatar({ name }: { name: string }) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold">
      {initial}
    </div>
  );
}

// 서브 컴포넌트: 참여자

interface ParticipantRowProps {
  id: string;
  name: string;
  micOn: boolean;
  isSpeaking: boolean;
  isMe?: boolean;
  isRemoteMuted?: boolean;
  onToggle: () => void;
}

/**
 * 개별 참여자 표시 행
 * - 말하는 중이면 초록색 테두리 표시
 * - 마이크 상태에 따라 아이콘 색상 변경
 */

function ParticipantRow({
  name,
  micOn,
  isSpeaking,
  isMe,
  isRemoteMuted,
  onToggle,
}: ParticipantRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1 py-1 hover:bg-slate-50 transition-colors group bg-sky-100">
      {/* 왼쪽: 아바타 + 이름 */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {/* 말하는 중이면 아바타 테두리 강조 */}
        <div
          className={[
            "relative rounded-full p-[2px] transition-all duration-200 shrink-0",
            isSpeaking ? "bg-emerald-500 shadow-sm" : "bg-transparent",
          ].join(" ")}
        >
          <Avatar name={name} />
          {/* 말하는 중 아이콘 애니메이션 (옵션) */}
          {isSpeaking && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-semibold text-slate-800 leading-tight">
              {name}
            </span>
            {/* 내 표시 */}
            {isMe && (
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                host
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 truncate">
            {/* 상태 메시지 예시 (추후 연동 가능) */}
            {isSpeaking ? "말하는 중..." : "대기 중"}
          </span>
        </div>
      </div>

      {/* 오른쪽: 마이크 상태 (클릭 가능) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // 이벤트 전파 방지
          onToggle();
        }}
        className={[
          "flex items-center gap-2 pl-3 group transition-opacity cursor-pointer hover:bg-slate-50 rounded-lg py-1",
          isRemoteMuted ? "opacity-50" : "opacity-100",
        ].join(" ")}
        title={
          isMe
            ? micOn
              ? "내 마이크 끄기"
              : "내 마이크 켜기"
            : isRemoteMuted
              ? "음소거 해제"
              : "상대방 음소거"
        }
      >
        <span
          className={[
            "transition-colors",
            isRemoteMuted
              ? "text-rose-500"
              : micOn
                ? "text-emerald-500"
                : "text-slate-400",
          ].join(" ")}
        >
          <MicIcon on={micOn} isPeerMuted={isRemoteMuted} />
        </span>
        <span
          className={[
            "text-[13px] font-semibold transition-colors",
            isRemoteMuted
              ? "text-rose-600"
              : micOn
                ? "text-emerald-600"
                : "text-slate-400",
          ].join(" ")}
        >
          {isMe
            ? micOn
              ? "ON"
              : "OFF"
            : isRemoteMuted
              ? "MUTED"
              : micOn
                ? "ON"
                : "OFF"}
        </span>
      </button>
    </div>
  );
}

/**
 * 참여자 목록 컴포넌트
 *
 * 사용 예시:
 * <ParticipantList
 *   participants={participants}
 *   myUserId={userId}
 * />
 */
export function VoiceChat({
  participants,
  myUserId,
  onToggleMic,
  onTogglePeerMute,
  isPeerMuted,
}: ParticipantListProps) {
  return (
    <div className="rounded-xl flex flex-col h-full">
      <h2 className="text-[11px] font-bold text-slate-500 mb-1 px-1 uppercase tracking-wider">
        참여자
      </h2>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {/* map으로 리스트 렌더링, key는 고유한 userId 사용 */}
        {participants.map((p) => (
          <ParticipantRow
            key={p.userId}
            id={p.userId}
            name={p.userName}
            micOn={p.micOn}
            isSpeaking={p.isSpeaking}
            isMe={p.userId === myUserId}
            isRemoteMuted={p.userId !== myUserId && isPeerMuted(p.userId)}
            onToggle={() =>
              p.userId === myUserId ? onToggleMic() : onTogglePeerMute(p.userId)
            }
          />
        ))}
        {/* 참여자가 없을 때 */}
        {participants.length === 0 && (
          <p className="text-center text-slate-400 py-4 text-sm">
            아직 참여자가 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
