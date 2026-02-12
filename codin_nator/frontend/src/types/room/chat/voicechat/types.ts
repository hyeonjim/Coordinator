import type { UseWebRTCReturn } from "@/types/room/chat/voicechat/webrtc";
import type { Participant } from "@/types/room/types";

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
 * JOIN/IDENTITY 메시지의 사용자 정보 데이터
 */
export interface UserPresenceData {
  userName?: string;
  imageUrl?: string;
  micOn?: boolean;
}

/**
 * WebRTC Offer/Answer 페이로드
 */
export interface SessionDescriptionPayload {
  type: "offer" | "answer";
  sdp: string;
}

/**
 * WebRTC Offer 페이로드 (SDP + 발신자 정보 포함)
 * JOIN 시 기존 참여자들이 상대방 정보를 함께 전달합니다.
 */
export interface OfferPayload extends SessionDescriptionPayload, UserPresenceData {}

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
  sendMessage(payload: VoiceChatMessagePayload): void;
  connect(): void;
  disconnect(): void;
}

/**
 * 음성 채팅 훅들이 공통으로 필요로 하는 사용자/방 컨텍스트
 * useRoomVoice와 useVoiceChatMessageHandler 모두 이 필드들을 사용합니다.
 */
export interface VoiceChatUserContext {
  currentRoomId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  isJoined: boolean;
}

/**
 * useVoiceChatMessageHandler 훅 파라미터
 * VoiceChatUserContext를 재사용합니다.
 */
export interface UseVoiceChatMessageHandlerParams extends VoiceChatUserContext {
  /** VoiceChat WebSocket 인스턴스 (시그널링용 STOMP) */
  voiceChatWebSocket: UseVoiceChatWebSocketReturn;
  /** WebRTC 인스턴스 (실제 음성 P2P 연결) */
  webRTC: UseWebRTCReturn;
  addParticipant: (
    participantId: string,
    participantName: string,
    imageUrl?: string,
    micOn?: boolean,
  ) => void;
  removeParticipant: (participantId: string) => void;
  /** 참여자 마이크 상태 업데이트 함수 */
  updateParticipantMicStatus: (participantId: string, micOn: boolean) => void;
}

/**
 * useRoomVoice 훅 파라미터
 * VoiceChatUserContext를 재사용합니다.
 */
export interface UseRoomVoiceParams extends VoiceChatUserContext {
  /** 참여자 목록 상태 업데이트 함수 */
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
}

/**
 * useRoomVoice 훅 반환 타입
 */
export interface UseRoomVoiceReturn {
  isWebSocketConnected: boolean;
  isMicOn: boolean;
  handleToggleMic: () => Promise<void>;
  /** 피어 음소거 토글 */
  togglePeerMute: (peerId: string) => void;
  /** 피어 음소거 상태 확인 */
  isPeerMuted: (peerId: string) => boolean;
  /** WebRTC 인스턴스 */
  webRTC: UseWebRTCReturn;
  /** 음성 채팅 WebSocket 인스턴스 (시그널링용) */
  voiceChatWebSocket: UseVoiceChatWebSocketReturn;
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
  participants: Participant[];
  myUserId: string;
  onToggleMic: () => void;
  /** 특정 피어 음소거 토글 핸들러 */
  onTogglePeerMute: (peerId: string) => void;
  /** 피어 음소거 상태 확인 함수 */
  isPeerMuted: (peerId: string) => boolean;
  isWebSocketConnected: boolean;
}
