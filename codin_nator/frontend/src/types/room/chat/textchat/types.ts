/**
 * - ENTER: 사용자가 방에 입장했을 때
 * - TALK: 일반 채팅 메시지
 * - LEAVE: 사용자가 방에서 퇴장했을 때
 */
export type TextChatMessageType = "ENTER" | "TALK" | "LEAVE";

/**
 * 백엔드로 전송하는 텍스트 채팅 메시지
 */
export interface TextChatMessagePayload {
  roomId: string;
  sender: string;
  /** 메시지 내용 (ENTER, LEAVE 타입일 경우 빈 문자열로 전송, 서버가 자동 생성) */
  message: string;
  /** 메시지 타입: ENTER(입장) 또는 TALK(채팅) */
  type: TextChatMessageType;
  imageUrl?: string;
  timestamp?: number;
}

/**
 * 백엔드로부터 받는 텍스트 채팅 메시지
 * 서버가 브로드캐스트한 메시지입니다.
 * ENTER 메시지의 경우, 서버가 "{sender}님이 입장하셨습니다." 형태로 message를 자동 생성합니다.
 * LEAVE 메시지의 경우, 서버가 "{sender}님이 퇴장하셨습니다." 형태로 message를 자동 생성합니다.
 */
export interface TextChatMessageReceived {
  roomId: string;
  sender: string;
  message: string;
  type: TextChatMessageType;
  imageUrl?: string;
  timestamp?: number;
}

/**
 * useTextChatWebSocket 훅의 반환 타입
 * 텍스트 채팅을 위한 STOMP 연결 및 메시지 송수신 기능을 제공합니다.
 */
export interface UseTextChatWebSocketReturn {
  /** STOMP 연결 상태*/
  isConnected: boolean;

  /**
   * 특정 채팅방 구독 함수
   * 백엔드의 /sub/chat/room/{roomId} 경로를 구독합니다.
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
   * @param payload - 전송할 메시지 페이로드
   */
  sendMessage: (payload: TextChatMessagePayload) => void;

  /** STOMP 연결 시작 함수 */
  connect: () => void;

  /** STOMP 연결 종료 함수 */
  disconnect: () => void;
}

/**
 * 화면에 렌더링되는 채팅 메시지 (프론트엔드 뷰 모델)
 */
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  imageUrl?: string;
  isMe: boolean;
  type?: "ENTER" | "TALK" | "LEAVE";
}

/**
 * TextChat 컴포넌트 Props 타입
 */
export interface TextChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  /** 비활성화 여부 (방 미참여 시) */
  disabled?: boolean;
  /** 사이드바 축소 여부 */
  isSidebarCollapsed: boolean;
  /** 사이드바 축소 상태 변경 */
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * useTextChatMessageHandler 훅 파라미터
 */
export interface UseTextChatMessageHandlerParams {
  /** 텍스트 채팅 WebSocket 인스턴스 */
  textChatWebSocket: UseTextChatWebSocketReturn;
  currentRoomId: string;
  userName: string;
  isJoined: boolean;
  /** 채팅 메시지 상태 업데이트 함수 */
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

/**
 * useRoomChat 훅 반환 타입
 */
export interface UseRoomChatReturn {
  /** 텍스트 채팅 WebSocket 인스턴스 */
  textChatWebSocket: UseTextChatWebSocketReturn;
}
