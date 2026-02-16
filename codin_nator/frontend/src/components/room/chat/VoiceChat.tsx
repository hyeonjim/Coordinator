/**
 * VoiceChat - 음성 채팅 참여자 목록 UI
 *
 * [React 기초 - 컴포넌트 분리]
 * - MicIcon, Avatar, ParticipantRow, VoiceChat 4개의 컴포넌트로 분리
 * - 각 컴포넌트는 하나의 역할만 담당 (단일 책임 원칙)
 * - 작은 컴포넌트를 조합하여 복잡한 UI를 구성
 *
 * [React 기초 - 조건부 렌더링]
 * - MicIcon: on, isPeerMuted 조건에 따라 3가지 다른 SVG 아이콘 반환
 * - Avatar: imageUrl 유무에 따라 이미지 또는 이름 첫 글자 표시
 *
 * [React 기초 - 이벤트 핸들링]
 * - event.stopPropagation(): 이벤트 버블링 방지 (부모의 클릭 이벤트가 실행되지 않게)
 * - onToggle: 마이크 토글 함수를 콜백으로 전달
 *
 * [사용된 기술]
 * - SVG 아이콘: JSX 안에서 직접 SVG를 렌더링
 * - useRoomContext: 참여자 목록, 마이크 상태 등 전역 상태 접근
 */
import type {
  MicIconProps,
  AvatarProps,
  ParticipantRowProps,
} from "@/types/voice";
import { useRoomContext } from "@/hooks/room/useRoomContext";

/**
 * MicIcon - 마이크 상태에 따라 다른 SVG 아이콘을 반환
 * 조건부 렌더링의 전형적인 예: isPeerMuted → 음소거 아이콘, on → 마이크 켜짐, else → 마이크 꺼짐
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
 * Avatar - 사용자 아바타 (이미지 우선, 없을 경우 이름 첫 글자)
 * 옵셔널 체이닝(?.)과 널 병합(??)을 활용한 안전한 값 접근 패턴
 */
function Avatar({ name, imageUrl }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-semibold overflow-hidden bg-(--rc-vc-avatar-bg) text-(--rc-vc-avatar-text) transition-all duration-300">
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

/**
 * ParticipantRow - 개별 참여자 표시 행
 * 여러 props를 구조분해할당으로 받아 아바타, 이름, 마이크 상태를 표시
 */
function ParticipantRow({
  name, // 참여자 이름
  imageUrl, // 프로필 이미지 URL
  micOn, // 마이크 on/off 상태
  isSpeaking, // 현재 말하는 중인지 여부
  isRemoteMuted, // 원격에서 음소거되었는지 여부
  onToggle, // 마이크 토글 콜백 함수
}: ParticipantRowProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1 transition-colors duration-150 hover:bg-(--rc-vc-row-hover) hover:rounded-[15px] group">
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
        <span className="truncate text-[16px] font-medium leading-tight text-(--rc-vc-name)">{name}</span>
      </div>

      {/* 오른쪽: 마이크 상태 */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={`flex items-center cursor-pointer transition-all duration-150 ${isRemoteMuted ? "opacity-50" : "opacity-100"}`}
      >
        <span
          className={
            isRemoteMuted
              ? "text-[#d87a7a]"
              : micOn
                ? "text-[#5fad5f]"
                : "text-[#414349]"
          }
        >
          <MicIcon on={micOn} isPeerMuted={isRemoteMuted} />
        </span>
        <span
          className={`text-[13px] font-bold w-9 text-center ${
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
 * VoiceChat - 음성 채팅 메인 컴포넌트
 * participants 배열을 map()으로 순회하며 각 참여자를 ParticipantRow로 렌더링
 */
export function VoiceChat() {
  const {
    participants, // 현재 참여자 배열
    userId, // 현재 사용자 ID (내 마이크 vs 상대 마이크 구분용)
    handleToggleMic, // 내 마이크 토글 함수
    togglePeerMute, // 상대방 음소거 토글 함수
    isPeerMuted, // 특정 사용자가 음소거인지 확인하는 함수
  } = useRoomContext();

  return (
    <div className="flex flex-col h-full overflow-hidden text-(--rc-vc-text)">
      <div className="flex items-center justify-between p-1 bg-(--rc-vc-header-bg) border-t border-(--rc-vc-header-border) text-(--rc-vc-header-text)">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest ml-[10px]">참여자 목록</h2>
        <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ea03e] animate-pulse" />
          <span>{participants.length}명 접속</span>
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto flex-1 p-1 pt-2 room-scrollbar bg-(--rc-vc-participants-bg)">
        {/* map으로 리스트 렌더링: key={participant.userId}로 고유 식별 */}
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
          <div className="flex flex-col items-center justify-center py-5">
            <p className="text-sm font-medium">참여자가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
