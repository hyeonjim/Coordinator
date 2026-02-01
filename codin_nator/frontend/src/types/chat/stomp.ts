/**
 * STOMP (Simple Text Oriented Messaging Protocol) 관련 타입 정의
 *
 * STOMP란?
 * - WebSocket 위에서 동작하는 메시징 프로토콜
 * - Pub/Sub(발행/구독) 패턴을 지원
 * - 텍스트 기반 프로토콜로 디버깅이 쉬움
 * - Spring Framework의 WebSocket과 완벽 호환
 *
 * SockJS란?
 * - WebSocket의 폴백(대체) 라이브러리
 * - 구형 브라우저에서는 WebSocket 대신 long-polling, Server-Sent Events 등을 사용
 * - WebSocket이 지원되는 환경에서는 자동으로 WebSocket 사용
 *
 * 동작 흐름:
 * 1. SockJS로 서버에 연결 (WebSocket 또는 폴백)
 * 2. STOMP 프로토콜로 handshake
 * 3. destination(목적지)을 구독 (예: /sub/chat/room/123)
 * 4. 메시지를 발행 (예: /pub/chat/message)
 * 5. 서버가 구독자들에게 메시지 브로드캐스트
 */



/**
 * STOMP 연결 설정
 */
export interface StompConfig {
  /** WebSocket 또는 SockJS 엔드포인트 URL */
  brokerURL: string;

  /** 디버그 모드 활성화 (콘솔에 STOMP 프레임 출력) */
  debug?: boolean;

  /** 재연결 대기 시간 (밀리초, 0이면 재연결 비활성화) */
  reconnectDelay?: number;

  /** 서버로 보내는 Heartbeat 간격 (밀리초) */
  heartbeatOutgoing?: number;

  /** 서버에서 기대하는 Heartbeat 간격 (밀리초) */
  heartbeatIncoming?: number;
}

/**
 * STOMP 메시지 제네릭 타입
 *
 * STOMP 메시지는 다음 구조를 가집니다:
 * - command: CONNECT, SEND, SUBSCRIBE, MESSAGE 등
 * - headers: 메타데이터 (destination, content-type 등)
 * - body: 실제 메시지 내용 (JSON 문자열)
 *
 * @template T - body를 파싱한 후의 타입
 */
export interface StompMessage<T> {
  /** STOMP 명령어 */
  command: string;

  /** 메시지 헤더 */
  headers: Record<string, string>;

  /** 메시지 본문 (파싱 전 JSON 문자열) */
  body: string;

  /** 파싱된 메시지 본문 */
  parsedBody?: T;
}

/**
 * STOMP 구독 정보
 */
export interface StompSubscription {
  /** 구독 ID (자동 생성) */
  id: string;

  /** 구독 destination (예: /sub/chat/room/123) */
  destination: string;

  /** 구독 해제 함수 */
  unsubscribe: () => void;
}

/**
 * STOMP 연결 상태
 */
export type StompConnectionState =
  | "connecting" // 연결 시도 중
  | "connected" // 연결됨
  | "disconnecting" // 연결 해제 중
  | "disconnected"; // 연결 해제됨

/**
 * STOMP 클라이언트 훅 반환 타입
 */
export interface UseStompClientReturn {
  /** 연결 상태 */
  isConnected: boolean;

  /** 현재 연결 상태 (상세) */
  connectionState: StompConnectionState;

  /** 수동 연결 */
  connect: () => void;

  /** 수동 연결 해제 */
  disconnect: () => void;

  /**
   * destination 구독
   *
   * @param destination - 구독할 경로 (예: /sub/chat/room/123)
   * @param callback - 메시지 수신 시 호출될 콜백 함수
   * @returns 구독 정보 (unsubscribe 함수 포함)
   *
   * @example
   * ```typescript
   * const subscription = subscribe<ChatMessage>(
   *   '/sub/chat/room/123',
   *   (message) => {
   *     console.log('수신:', message);
   *   }
   * );
   *
   * // 구독 해제
   * subscription.unsubscribe();
   * ```
   */
  subscribe: <T>(
    destination: string,
    callback: (message: T) => void,
  ) => StompSubscription | null;

  /**
   * 메시지 발행
   *
   * @param destination - 발행할 경로 (예: /pub/chat/message)
   * @param body - 발행할 메시지 객체 (자동으로 JSON으로 변환됨)
   *
   * @example
   * ```typescript
   * publish('/pub/chat/message', {
   *   roomId: '123',
   *   sender: 'user1',
   *   message: '안녕하세요',
   *   type: 'TALK'
   * });
   * ```
   */
  publish: <T>(destination: string, body: T) => void;

  /**
   * 모든 구독 해제
   */
  unsubscribeAll: () => void;
}

/**
 * 재연결 옵션
 */
export interface ReconnectOptions {
  /** 최대 재연결 시도 횟수 (0이면 무제한) */
  maxAttempts?: number;

  /** 재연결 대기 시간 (밀리초) */
  delay?: number;

  /** 지수 백오프 사용 여부 (시도마다 대기 시간 증가) */
  exponentialBackoff?: boolean;
}

/**
 * STOMP 에러 타입
 */
export interface StompError {
  /** 에러 유형 */
  type: "connection" | "subscription" | "publish" | "unknown";

  /** 에러 메시지 */
  message: string;

  /** 원본 에러 객체 */
  originalError?: Error;
}
