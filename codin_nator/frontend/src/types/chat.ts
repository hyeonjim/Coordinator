/**
 * @file chat.ts - 텍스트 채팅 관련 타입 정의
 *
 * STOMP over SockJS 기반의 실시간 텍스트 채팅 시스템 타입을 정의합니다.
 *
 * 아키텍처 개요:
 * 1. 클라이언트가 SockJS로 WebSocket 연결 (STOMP 프로토콜 사용)
 * 2. /sub/chat/room/{roomId} 경로를 구독하여 메시지 수신
 * 3. /pub/chat/message 경로로 메시지 발행
 * 4. 서버가 같은 방의 모든 구독자에게 메시지 브로드캐스트
 *
 * STOMP(Simple Text Oriented Messaging Protocol):
 * - WebSocket 위에서 동작하는 메시징 프로토콜
 * - subscribe(구독), send(발행) 개념으로 pub/sub 패턴 구현
 * - Spring Boot의 @MessageMapping과 연동
 *
 * 통합 출처:
 * - types/room/chat/stomp.ts (STOMP 공통 타입)
 * - types/room/chat/textchat/types.ts (텍스트 채팅 메시지, UI 타입)
 */

/**
 * STOMP 연결 설정 옵션
 *
 * 텍스트 채팅과 음성 채팅 모두 STOMP over SockJS를 사용하며,
 * useStompConnection 훅에서 이 설정을 기반으로 연결을 관리합니다.
 */
export interface StompConnectionConfig {
  /** STOMP 브로커 URL (예: "http://localhost:8080/ws-chat") */
  brokerUrl: string;

  /** 구독 경로 접두사 (예: "/sub/chat/room" 또는 "/sub/voice/room") */
  subscriptionPathPrefix: string;

  /** 발행 경로 (예: "/pub/chat/message" 또는 "/pub/voice/message") */
  publishPath: string;

  /** 마운트 시 자동 연결 여부 (기본값: false) */
  autoConnect?: boolean;
}

/**
 * STOMP 연결 훅 반환 타입 (제네릭)
 *
 * 제네릭(Generic)을 사용하여 텍스트 채팅과 음성 채팅에서
 * 각각 다른 메시지 타입으로 재사용할 수 있습니다.
 *
 * @template TPayload - 서버로 전송하는 메시지 타입 (예: TextChatMessagePayload)
 * @template TReceived - 서버로부터 수신하는 메시지 타입 (예: TextChatMessageReceived)
 */
export interface UseStompConnectionReturn<TPayload, TReceived> {
  /** STOMP 브로커와의 연결 상태 */
  isConnected: boolean;

  /**
   * 특정 방을 구독합니다.
   * subscriptionPathPrefix + "/" + roomId 경로를 구독합니다.
   *
   * @param roomId - 구독할 방 ID
   * @param onMessage - 메시지 수신 시 호출될 콜백
   */
  subscribeToRoom: (
    roomId: string,
    onMessage: (message: TReceived) => void,
  ) => void;

  /** 현재 구독 중인 방의 구독을 해제합니다. */
  unsubscribeFromRoom: () => void;

  /**
   * 메시지를 발행합니다.
   * publishPath 경로로 메시지를 전송합니다.
   */
  sendMessage: (payload: TPayload) => void;

  /** STOMP 연결을 시작합니다. */
  connect: () => void;

  /** STOMP 연결을 종료합니다. */
  disconnect: () => void;
}

/**
 * 텍스트 채팅 메시지 타입
 *
 * 채팅 메시지의 종류를 나타내는 유니온 리터럴 타입입니다.
 * - ENTER: 사용자가 방에 입장했을 때 (시스템 메시지)
 * - TALK: 일반 채팅 메시지
 * - LEAVE: 사용자가 방에서 퇴장했을 때 (시스템 메시지)
 */
export type TextChatMessageType = "ENTER" | "TALK" | "LEAVE";

/**
 * 서버로 전송하는 텍스트 채팅 메시지 (발행용)
 *
 * /pub/chat/message 경로로 STOMP 프레임에 담아 전송합니다.
 * 백엔드의 ChatMessageDto와 매핑됩니다.
 */
export interface TextChatMessagePayload {
  /** 방 ID */
  roomId: string;

  /** 발신자 이름 */
  sender: string;

  /**
   * 메시지 내용
   * ENTER, LEAVE 타입일 경우 빈 문자열로 전송하면
   * 서버가 "{sender}님이 입장/퇴장하셨습니다." 형태로 자동 생성합니다.
   */
  message: string;

  /** 메시지 타입 */
  type: TextChatMessageType;

  /** 발신자 프로필 이미지 URL */
  imageUrl?: string;

  /** 전송 타임스탬프 (Unix milliseconds) */
  timestamp?: number;
}

/**
 * 서버로부터 수신하는 텍스트 채팅 메시지 (구독에서 수신)
 *
 * 서버가 브로드캐스트한 메시지입니다.
 * ENTER/LEAVE 메시지의 경우 서버가 message 필드를 자동 생성합니다.
 */
export interface TextChatMessageReceived {
  /** 방 ID */
  roomId: string;

  /** 발신자 이름 */
  sender: string;

  /** 메시지 내용 */
  message: string;

  /** 메시지 타입 */
  type: TextChatMessageType;

  /** 발신자 프로필 이미지 URL */
  imageUrl?: string;

  /** 수신 타임스탬프 (Unix milliseconds) */
  timestamp?: number;
}

/**
 * useTextChatWebSocket 훅의 반환 타입
 *
 * 텍스트 채팅을 위한 STOMP 연결 및 메시지 송수신 기능을 제공합니다.
 * UseStompConnectionReturn을 텍스트 채팅에 특화하여 구체화한 타입입니다.
 */
export interface UseTextChatWebSocketReturn {
  /** STOMP 연결 상태 */
  isConnected: boolean;

  /**
   * 특정 채팅방을 구독합니다.
   * /sub/chat/room/{roomId} 경로를 구독합니다.
   *
   * @param roomId - 구독할 채팅방 ID
   * @param onMessage - 메시지 수신 시 호출될 콜백
   */
  subscribeToRoom: (
    roomId: string,
    onMessage: (message: TextChatMessageReceived) => void,
  ) => void;

  /** 현재 구독 중인 채팅방 구독 해제 */
  unsubscribeFromRoom: () => void;

  /**
   * 메시지를 발행합니다.
   * /pub/chat/message 경로로 전송합니다.
   */
  sendMessage: (payload: TextChatMessagePayload) => void;

  /** STOMP 연결 시작 */
  connect: () => void;

  /** STOMP 연결 종료 */
  disconnect: () => void;
}

/**
 * 화면에 렌더링되는 채팅 메시지 (프론트엔드 뷰 모델)
 *
 * 서버에서 받은 TextChatMessageReceived를 UI 렌더링에 적합한 형태로 변환한 것입니다.
 * isMe 필드를 추가하여 내 메시지와 상대 메시지를 구분합니다.
 */
export interface ChatMessage {
  /** 메시지 고유 ID (프론트엔드에서 생성, React key로 사용) */
  id: string;

  /** 발신자 사용자 ID */
  userId: string;

  /** 발신자 이름 */
  userName: string;

  /** 메시지 내용 */
  message: string;

  /** 타임스탬프 (Unix milliseconds) */
  timestamp: number;

  /** 발신자 프로필 이미지 URL */
  imageUrl?: string;

  /** 내가 보낸 메시지인지 여부 (UI 정렬에 사용) */
  isMe: boolean;

  /** 메시지 타입 (ENTER/LEAVE는 시스템 메시지로 별도 스타일링) */
  type?: "ENTER" | "TALK" | "LEAVE";
}

/**
 * TextChat 컴포넌트 Props
 *
 * 채팅 메시지 목록과 전송 기능을 제공하는 사이드바 채팅 UI입니다.
 */
export interface TextChatProps {
  /** 표시할 채팅 메시지 목록 */
  messages: ChatMessage[];

  /** 메시지 전송 핸들러 */
  onSendMessage: (text: string) => void;

  /** 비활성화 여부 (방 미참여 시 입력 차단) */
  disabled?: boolean;

  /** 사이드바 축소 여부 */
  isSidebarCollapsed: boolean;

  /** 사이드바 축소 상태 변경 함수 */
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * useTextChatMessageHandler 훅 파라미터
 *
 * 수신된 메시지를 ChatMessage 뷰 모델로 변환하고
 * 입장/퇴장 시 자동 메시지를 전송하는 훅의 의존성입니다.
 */
export interface UseTextChatMessageHandlerParams {
  /** 텍스트 채팅 WebSocket 인스턴스 */
  textChatWebSocket: UseTextChatWebSocketReturn;

  /** 현재 방 ID */
  currentRoomId: string;

  /** 현재 사용자 이름 */
  userName: string;

  /** 방 참여 완료 여부 */
  isJoined: boolean;

  /** 채팅 메시지 상태 업데이트 함수 */
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

/**
 * useRoomChat 훅 반환 타입
 *
 * 텍스트 채팅 관련 기능을 하나로 묶은 통합 훅의 반환 타입입니다.
 */
export interface UseRoomChatReturn {
  /** 텍스트 채팅 WebSocket 인스턴스 */
  textChatWebSocket: UseTextChatWebSocketReturn;
}
