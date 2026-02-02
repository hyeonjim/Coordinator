/**
 * 텍스트 채팅 메시지 타입
 * 백엔드 TextChatMessage.MessageType enum과 정확히 일치합니다.
 * - ENTER: 사용자가 방에 입장했을 때
 * - TALK: 일반 채팅 메시지
 */
export type TextChatMessageType = "ENTER" | "TALK";

/**
 * 백엔드로 전송하는 텍스트 채팅 메시지
 * 백엔드 TextChatMessage DTO와 정확히 일치해야 합니다.
 */
export interface TextChatMessagePayload {
  /** 채팅방 ID */
  roomId: string;

  /** 발신자 이름 */
  sender: string;

  /** 메시지 내용 (ENTER 타입일 경우 빈 문자열로 전송, 서버가 자동 생성) */
  message: string;

  /** 메시지 타입: ENTER(입장) 또는 TALK(채팅) */
  type: TextChatMessageType;

  /** 프로필 이미지 URL (GitHub 아바타) - 선택적 */
  imageUrl?: string;

  /** 메시지 전송 시간 (Unix timestamp) - 선택적, 서버가 자동 설정 */
  timestamp?: number;
}

/**
 * 백엔드로부터 받는 텍스트 채팅 메시지
 * 서버가 브로드캐스트한 메시지입니다.
 *
 * ENTER 메시지의 경우, 서버가 "{sender}님이 입장하셨습니다." 형태로 message를 자동 생성합니다.
 */
export interface TextChatMessageReceived {
  /** 채팅방 ID */
  roomId: string;

  /** 발신자 이름 */
  sender: string;

  /** 메시지 내용 (입장 메시지는 서버에서 자동 생성됨) */
  message: string;

  /** 메시지 타입 */
  type: TextChatMessageType;

  /** 프로필 이미지 URL (GitHub 아바타) */
  imageUrl?: string;

  /** 메시지 전송 시간 (Unix timestamp, 서버에서 설정) */
  timestamp?: number;
}

/**
 * STOMP 클라이언트 설정 옵션
 * useTextChatWebSocket 훅에서 내부적으로 사용됩니다.
 */
export interface StompClientConfig {
  /** 백엔드 WebSocket 엔드포인트 URL (예: http://localhost:8080/ws-chat) */
  brokerUrl: string;

  /** 연결 성공 콜백 */
  onConnect?: () => void;

  /**
   * STOMP 프로토콜 에러 콜백
   *
   * unknown 타입 사용 이유:
   * @stomp/stompjs의 내부 Frame 타입이 복잡하고 일관성이 없어,
   * 실무에서는 에러 로깅 용도로만 사용하므로 unknown 타입 사용 (any보다 안전)
   */
  onStompError?: (frame: unknown) => void;

  /** WebSocket 연결 에러 콜백 */
  onWebSocketError?: (event: Event) => void;

  /** 연결 종료 콜백 */
  onDisconnect?: () => void;
}

/**
 * useTextChatWebSocket 훅의 반환 타입
 * 텍스트 채팅을 위한 STOMP 연결 및 메시지 송수신 기능을 제공합니다.
 */
export interface UseTextChatWebSocketReturn {
  /** STOMP 연결 상태 (true: 연결됨, false: 연결 안 됨) */
  isConnected: boolean;

  /**
   * 특정 채팅방 구독 함수
   * 백엔드의 /sub/chat/room/{roomId} 경로를 구독합니다.
   *
   * @param roomId - 구독할 채팅방 ID
   * @param onMessage - 메시지 수신 시 호출될 콜백 함수
   */
  subscribeToRoom: (
    roomId: string,
    onMessage: (message: TextChatMessageReceived) => void,
  ) => void;

  /** 현재 구독 중인 채팅방 구독 해제 함수 */
  unsubscribeFromRoom: () => void;

  /**
   * 메시지 발행 함수
   * 백엔드의 /pub/chat/message 경로로 메시지를 전송합니다.
   *
   * @param payload - 전송할 메시지 페이로드
   */
  sendMessage: (payload: TextChatMessagePayload) => void;

  /** STOMP 연결 시작 함수 */
  connect: () => void;

  /** STOMP 연결 종료 함수 */
  disconnect: () => void;
}
