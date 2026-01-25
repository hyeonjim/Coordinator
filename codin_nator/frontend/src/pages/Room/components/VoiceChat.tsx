/**
 * VoiceChat 컴포넌트
 * ===================
 * 음성 채팅 제어 UI를 제공합니다.
 * 
 * 💡 학습 포인트:
 * - 버튼 상태에 따른 조건부 스타일링
 * - 음성 상태 시각적 피드백
 */

// ============================================================
// Props 타입 정의
// ============================================================

interface VoiceChatProps {
  /** 마이크 ON 상태 */
  isMicOn: boolean;
  /** 현재 말하는 중인지 */
  isSpeaking: boolean;
  /** 방에 참여했는지 */
  isJoined: boolean;
  /** 마이크 토글 핸들러 */
  onToggleMic: () => void;
  /** 방 참여 핸들러 */
  onJoin: () => void;
  /** 방 퇴장 핸들러 */
  onLeave: () => void;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

/**
 * 음성 채팅 제어 컴포넌트
 * 
 * 💡 기능:
 * - 방 참여/퇴장 버튼
 * - 마이크 ON/OFF 토글
 * - 말하는 중 표시 (애니메이션)
 */
export function VoiceChat({
  isMicOn,
  isSpeaking,
  isJoined,
  onToggleMic,
  onJoin,
  onLeave,
}: VoiceChatProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-[15px] font-bold text-slate-800 mb-3">음성 채팅</h2>
      
      <div className="flex items-center gap-3">
        {/* 참여 전: Join 버튼 */}
        {!isJoined ? (
          <button
            onClick={onJoin}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            🎤 음성 채팅 참여
          </button>
        ) : (
          <>
            {/* 마이크 토글 버튼 */}
            <button
              onClick={onToggleMic}
              className={[
                "flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors",
                isMicOn
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-rose-600 hover:bg-rose-500",
              ].join(" ")}
            >
              {isMicOn ? "🔊 마이크 끄기" : "🔇 마이크 켜기"}
            </button>
            
            {/* 퇴장 버튼 */}
            <button
              onClick={onLeave}
              className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-600 transition-colors"
            >
              나가기
            </button>
          </>
        )}
      </div>
      
      {/* 말하는 중 표시 */}
      {isJoined && (
        <div className="mt-3 flex items-center gap-2">
          {/* 💡 말하는 중이면 애니메이션 표시 */}
          <div
            className={[
              "h-3 w-3 rounded-full transition-colors",
              isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-slate-300",
            ].join(" ")}
          />
          <span className="text-sm text-slate-600">
            {isSpeaking ? "말하는 중..." : isMicOn ? "대기 중" : "음소거됨"}
          </span>
        </div>
      )}
    </div>
  );
}
