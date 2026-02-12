import type { Participant } from "@/types/room/types";
import type { UseWebRTCReturn } from "@/types/room/chat/voicechat/webrtc";

export type VoiceMessageType =
  | "JOIN"
  | "OFFER"
  | "ANSWER"
  | "ICE"
  | "MIC"
  | "LEAVE"
  | "PEER_LIST" // 참여자 목록
  | "IDENTITY"; // 사용자 신원 정보 (이름, 이미지)

/**
 * 서버로 전송하는 VoiceChat 메시지
 * 백엔드 SignalingMessage DTO와 매핑
 */
export interface VoiceChatMessagePayload {
  type: VoiceMessageType;
  roomId: string;
  senderId: string;
  receiverId?: string; // peer-to-peer 메시지용 (optional)
  data?: unknown; // SDP, ICE candidate, mic status 등
}

/**
 * 서버로부터 수신하는 VoiceChat 메시지
 */
export interface VoiceChatMessageReceived {
  type: VoiceMessageType;
  roomId: string;
  senderId: string;
  receiverId?: string;
  data?: unknown;
}

/**
 * WebRTC Offer/Answer 페이로드
 */
export interface SessionDescriptionPayload {
  type: "offer" | "answer";
  sdp: string;
}

/**
 * ICE Candidate 페이로드
 */
export interface IceCandidatePayload {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

/**
 * 마이크 상태 페이로드
 */
export interface MicrophoneStatusPayload {
  microphoneOn: boolean;
}

/**
 * 참여자 정보 (PEER_LIST data)
 */
export type ParticipantList = string[]; // userId 배열

/**
 * VoiceChat WebSocket 훅 반환 타입
 */
export interface UseVoiceChatWebSocketReturn {
  /** WebSocket 연결 상태 */
  isConnected: boolean;

  /** 방 구독 (메시지 수신 시작) */
  subscribeToRoom(
    roomId: string,
    onMessage: (message: VoiceChatMessageReceived) => void,
  ): void;

  /** 방 구독 해제 */
  unsubscribeFromRoom(): void;

  /** 메시지 전송 */
  sendMessage(payload: VoiceChatMessagePayload): void;

  /** WebSocket 연결 */
  connect(): void;

  /** WebSocket 연결 해제 */
  disconnect(): void;
}

/**
 * useParticipantManagement 훅 파라미터 타입
 */
export interface UseParticipantManagementParams {
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  userId: string;
  userName: string;
  userImageUrl?: string;
  webRTC: UseWebRTCReturn;
  isJoined: boolean;
}

export interface MicIconProps {
  on: boolean;
  isPeerMuted?: boolean;
}

export interface AvatarProps {
  name: string;
  imageUrl?: string;
}

/**
 * 개별 참여자 행 컴포넌트 Props
 */
export interface ParticipantRowProps {
  id?: string;
  name: string;
  imageUrl?: string;
  micOn: boolean;
  isSpeaking: boolean;
  isMe?: boolean;
  isRemoteMuted?: boolean;
  onToggle: () => void;
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
