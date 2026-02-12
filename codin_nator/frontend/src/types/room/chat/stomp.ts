/**
 * STOMP WebSocket 공통 타입 정의
 * 텍스트 채팅과 음성 채팅 모두 STOMP over SockJS를 사용하며,
 * 공통 연결 로직을 공유합니다.
 */

/**
 * STOMP 연결 설정 옵션
 */
export interface StompConnectionConfig {
  /** STOMP 브로커 URL (예: http://localhost:8080/ws-chat) */
  brokerUrl: string;
  /** 구독 경로 접두사 (예: /sub/chat/room 또는 /sub/voice/room) */
  subscriptionPathPrefix: string;
  /** 발행 경로 (예: /pub/chat/message 또는 /pub/voice/message) */
  publishPath: string;
  /** 마운트 시 자동 연결 여부 (기본값: false) */
  autoConnect?: boolean;
}

/**
 * STOMP 연결 훅 반환 타입 (제네릭)
 *
 * @template TPayload - 서버로 전송하는 메시지 타입
 * @template TReceived - 서버로부터 수신하는 메시지 타입
 */
export interface UseStompConnectionReturn<TPayload, TReceived> {
  isConnected: boolean;

  /**
   * 특정 방 구독
   * @param roomId - 구독할 방 ID
   * @param onMessage - 메시지 수신 콜백
   */
  subscribeToRoom: (
    roomId: string,
    onMessage: (message: TReceived) => void,
  ) => void;

  unsubscribeFromRoom: () => void;
  sendMessage: (payload: TPayload) => void;
  connect: () => void;
  disconnect: () => void;
}
