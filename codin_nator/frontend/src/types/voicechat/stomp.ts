import type { VoiceChatMessagePayload, VoiceChatMessageReceived } from "./message";
import type { Participant } from "@/types/chat/voicetypes";
import type { UseWebRTCReturn } from "@/types/chat/webrtc";

/**
 * STOMP 클라이언트 설정
 */
export interface StompClientConfiguration {
  brokerUrl: string;
  onConnect?: () => void;
  onStompError?: (frame: unknown) => void;
  onWebSocketError?: (event: Event) => void;
  onDisconnect?: () => void;
}

/**
 * VoiceChat WebSocket 훅 반환 타입
 */
export interface UseVoiceChatWebSocketReturn {
  /** WebSocket 연결 상태 */
  isConnected: boolean;

  /** 방 구독 (메시지 수신 시작) */
  subscribeToRoom(
    roomId: string,
    onMessage: (message: VoiceChatMessageReceived) => void
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
