/**
 * - WebSocket은 양방향 실시간 통신을 제공합니다
 * - useRef로 WebSocket 인스턴스를 저장하여 리렌더링에도 유지
 * - useCallback으로 함수 메모이제이션하여 불필요한 재생성 방지
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SignalMessage,
  UseWebSocketReturn,
} from "../../../types/chat/types";

/**
 * WebSocket 연결 관리 훅
 *
 * @param url - WebSocket 서버 URL (예: "wss://example.com/ws")
 * @returns WebSocket 연결 상태와 제어 함수들
 *
 * 사용 예시:
 * const { isConnected, send, lastMessage } = useWebSocket("wss://server.com");
 */
export function useWebSocket(url: string): UseWebSocketReturn {
  // 상태 관리
  /**
   *   useRef vs useState:
   * - useRef: 값이 바뀌어도 리렌더링하지 않음 (WebSocket 인스턴스에 적합)
   * - useState: 값이 바뀌면 리렌더링됨 (UI에 표시할 상태에 적합)
   */
  const wsRef = useRef<WebSocket | null>(null);

  // 연결 상태 (UI에 표시하므로 useState 사용)
  const [isConnected, setIsConnected] = useState(false);

  // 마지막으로 받은 메시지 (컴포넌트에서 처리하므로 useState 사용)
  const [lastMessage, setLastMessage] = useState<SignalMessage | null>(null);

  // WebSocket 연결 함수

  /**
   * WebSocket 서버에 연결합니다.
   *   useCallback을 사용하는 이유:
   * - 함수를 메모이제이션하여 매 렌더링마다 새로 만들지 않음
   * - 의존성 배열의 값이 바뀔 때만 함수를 새로 생성
   */
  const connect = useCallback(() => {
    // 이미 연결되어 있으면 무시
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔄 이미 WebSocket에 연결되어 있습니다.");
      return;
    }

    // URL이 없으면 경고
    if (!url) {
      console.warn("WebSocket URL이 설정되지 않았습니다.");
      return;
    }

    // 새 WebSocket 인스턴스 생성
    const ws = new WebSocket(url);
    wsRef.current = ws;

    // 연결 성공 시
    ws.onopen = () => {
      console.log("✅ WebSocket 연결됨");
      setIsConnected(true);
    };

    // 연결 종료 시
    ws.onclose = () => {
      console.log("❌ WebSocket 연결 끊김");
      setIsConnected(false);
    };

    // 에러 발생 시
    ws.onerror = (error) => {
      console.error("WebSocket 에러:", error);
      setIsConnected(false);
    };

    // 메시지 수신 시
    ws.onmessage = (event) => {
      try {
        // JSON 문자열을 파싱하여 객체로 변환
        const message = JSON.parse(event.data) as SignalMessage;
        setLastMessage(message);
      } catch (error) {
        console.error("메시지 파싱 에러:", error);
      }
    };
  }, [url]);

  // WebSocket 연결 해제 함수

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 메시지 전송 함수
  /**
   * 서버로 메시지를 전송합니다.
   *    WebSocket.send()는 문자열만 전송 가능하므로
   *    객체를 JSON.stringify()로 문자열로 변환합니다.
   */
  const send = useCallback((message: SignalMessage) => {
    const ws = wsRef.current;

    // 연결 상태 확인
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket이 연결되지 않았습니다.");
      return;
    }

    // 객체를 JSON 문자열로 변환하여 전송
    ws.send(JSON.stringify(message));
  }, []);

  // 컴포넌트 언마운트 시 정리
  /**
   *   useEffect의 cleanup 함수:
   * - 컴포넌트가 언마운트될 때 실행됨
   * - WebSocket 연결을 정리하여 메모리 누수 방지
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected, // 연결 상태
    send, // 메시지 전송 함수
    lastMessage, // 마지막 수신 메시지
    connect, // 연결 함수
    disconnect, // 연결 해제 함수
  };
}
