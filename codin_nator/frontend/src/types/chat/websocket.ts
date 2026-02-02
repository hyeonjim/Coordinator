import type { SignalMessage } from "./signaling";

/**
 * useWebSocket 훅의 반환 타입
 * WebSocket 연결 관리 및 메시지 송수신 기능 정의
 */
export interface UseWebSocketReturn {
  /** 연결 상태 */
  isConnected: boolean;
  /** 메시지 전송 함수 */
  send: (message: SignalMessage) => void;
  /** 마지막으로 받은 메시지 */
  lastMessage: SignalMessage | null;
  /** WebSocket 연결 함수 */
  connect: () => void;
  /** WebSocket 연결 해제 함수 */
  disconnect: () => void;
}
