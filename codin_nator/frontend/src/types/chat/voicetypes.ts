/**
 * 참여자의 전체 상태
 * - userId: 고유 식별자
 * - userName: 화면에 표시할 이름
 * - isSpeaking: 현재 말하고 있는지 (음성 감지)
 * - micOn: 마이크 켜짐 여부
 */
export interface Participant {
  userId: string;
  userName: string;
  isSpeaking: boolean;
  micOn: boolean;
}

/**
 * VoiceChat 컴포넌트 Props 타입
 */
export interface VoiceChatProps {
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
  /** 개발 도구 테스트 헬퍼 */
  testHelpers?: {
    simulateTestUserJoin: () => void;
    simulateTestUserMessage: () => void;
    simulateIncomingAudio: () => void;
  };
  /** WebSocket 연결 상태 */
  isWebSocketConnected: boolean;
}

export interface ParticipantRowProps {
  id: string;
  name: string;
  micOn: boolean;
  isSpeaking: boolean;
  isMe?: boolean;
  isRemoteMuted?: boolean;
  onToggle: () => void;
}
