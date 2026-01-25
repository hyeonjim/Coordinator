/**
 * ParticipantList 컴포넌트
 * =========================
 * 방에 참여한 사용자들의 목록을 표시합니다.
 * 
 * 💡 학습 포인트:
 * - React의 리스트 렌더링 (map 함수 사용)
 * - 조건부 스타일링 (말하는 중일 때 테두리 강조)
 */

import type { Participant } from "../types";

// ============================================================
// Props 타입 정의
// ============================================================

interface ParticipantListProps {
  /** 참여자 목록 */
  participants: Participant[];
  /** 현재 사용자 ID (내 표시용) */
  myUserId: string;
}

// ============================================================
// 서브 컴포넌트: 마이크 아이콘
// ============================================================

/**
 * 마이크 ON/OFF 아이콘
 * 
 * 💡 SVG를 직접 사용하면 외부 의존성 없이 아이콘 표시 가능
 */
function MicIcon({ on }: { on: boolean }) {
  if (on) {
    // 마이크 ON 아이콘
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </svg>
    );
  }
  
  // 마이크 OFF 아이콘 (사선 표시)
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5a3 3 0 0 1 6 1v5a3 3 0 0 1-.17 1" />
      <path d="M19 11a7 7 0 0 1-9 6.71" />
      <path d="M5 11a7 7 0 0 0 11.5 5.5" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

// ============================================================
// 서브 컴포넌트: 아바타
// ============================================================

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

// ============================================================
// 서브 컴포넌트: 참여자 행
// ============================================================

interface ParticipantRowProps {
  name: string;
  micOn: boolean;
  isSpeaking: boolean;
  isMe?: boolean;
}

/**
 * 개별 참여자 표시 행
 * 
 * 💡 조건부 스타일링:
 * - 말하는 중이면 초록색 테두리 표시
 * - 마이크 상태에 따라 아이콘 색상 변경
 */
function ParticipantRow({ name, micOn, isSpeaking, isMe }: ParticipantRowProps) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-xl px-3 py-3 bg-white",
        // 💡 말하는 중이면 테두리 강조
        isSpeaking ? "border-2 border-emerald-500" : "border border-slate-100",
      ].join(" ")}
    >
      {/* 왼쪽: 아바타 + 이름 */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={name} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-slate-900">
              {name}
            </span>
            {/* 내 표시 */}
            {isMe && (
              <span className="rounded-full bg-indigo-100 px-2 py-[2px] text-[11px] font-semibold text-indigo-600">
                나
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 마이크 상태 */}
      <div className="flex items-center gap-2 pl-3">
        <span className={micOn ? "text-emerald-500" : "text-slate-400"}>
          <MicIcon on={micOn} />
        </span>
        <span className={["text-[13px] font-semibold", micOn ? "text-emerald-600" : "text-slate-400"].join(" ")}>
          {micOn ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

/**
 * 참여자 목록 컴포넌트
 * 
 * 💡 사용 예시:
 * <ParticipantList 
 *   participants={participants} 
 *   myUserId={userId} 
 * />
 */
export function ParticipantList({ participants, myUserId }: ParticipantListProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-[15px] font-bold text-slate-800 mb-3">
        참여자 ({participants.length}명)
      </h2>
      
      <div className="space-y-2">
        {/* 💡 map으로 리스트 렌더링, key는 고유한 userId 사용 */}
        {participants.map((p) => (
          <ParticipantRow
            key={p.userId}
            name={p.userName}
            micOn={p.micOn}
            isSpeaking={p.isSpeaking}
            isMe={p.userId === myUserId}
          />
        ))}
        
        {/* 참여자가 없을 때 */}
        {participants.length === 0 && (
          <p className="text-center text-slate-400 py-4">
            아직 참여자가 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
