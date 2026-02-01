import { useEffect, useRef, useState, useCallback } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  StompConfig,
  StompConnectionState,
  StompSubscription,
  UseStompClientReturn,
} from "@/types/chat/stomp";

/**
 * STOMP 클라이언트 관리 커스텀 훅
 *
 * 작동 원리:
 * 1. SockJS로 WebSocket 연결 생성 (폴백 지원)
 * 2. STOMP 프로토콜로 handshake 수행
 * 3. 자동 재연결 및 Heartbeat 관리
 * 4. 구독/발행 메서드 제공
 *
 * STOMP 프레임 흐름:
 * - CONNECT → CONNECTED (연결 완료)
 * - SUBSCRIBE → (구독 시작)
 * - SEND → MESSAGE (메시지 발행 → 수신)
 * - DISCONNECT → (연결 종료)
 *
 * @param config - STOMP 연결 설정
 * @returns STOMP 클라이언트 제어 인터페이스
 *
 * @example
 * ```typescript
 * const stomp = useStompClient({
 *   brokerURL: 'ws://localhost:8080/ws-chat',
 *   debug: true
 * });
 *
 * // 연결
 * useEffect(() => {
 *   stomp.connect();
 *   return () => stomp.disconnect();
 * }, []);
 *
 * // 구독
 * useEffect(() => {
 *   if (!stomp.isConnected) return;
 *   const sub = stomp.subscribe('/sub/chat/room/123', (msg) => {
 *     console.log('수신:', msg);
 *   });
 *   return () => sub?.unsubscribe();
 * }, [stomp.isConnected]);
 *
 * // 발행
 * stomp.publish('/pub/chat/message', { message: '안녕' });
 * ```
 */
export function useStompClient(config: StompConfig): UseStompClientReturn {
  // STOMP 클라이언트 인스턴스 (리렌더링 시에도 유지)
  const clientRef = useRef<Client | null>(null);

  // 구독 목록 관리 (cleanup용)
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  // 연결 상태 관리
  const [connectionState, setConnectionState] =
    useState<StompConnectionState>("disconnected");
  const [isConnected, setIsConnected] = useState(false);

  // 재연결 시도 횟수
  const reconnectAttempts = useRef(0);

  /**
   * STOMP 클라이언트 초기화 및 연결
   */
  const connect = useCallback(() => {
    // 이미 연결 중이거나 연결됨
    if (
      clientRef.current?.connected ||
      connectionState === "connecting" ||
      connectionState === "connected"
    ) {
      console.log(
        "[STOMP] 이미 연결되어 있거나 연결 시도 중입니다.",
        connectionState,
      );
      return;
    }

    console.log("[STOMP] 연결 시작:", config.brokerURL);
    setConnectionState("connecting");

    // STOMP 클라이언트 생성
    const client = new Client({
      // SockJS를 WebSocket factory로 사용
      webSocketFactory: () => new SockJS(config.brokerURL),

      // 디버그 로그 (개발 환경에서만 활성화 권장)
      debug: config.debug
        ? (str) => {
            console.log("[STOMP Debug]", str);
          }
        : () => {}, // undefined 대신 빈 함수 사용

      // 재연결 설정 (5초 간격, 무제한 재시도)
      reconnectDelay: config.reconnectDelay ?? 5000,

      // Heartbeat 설정 (연결 유지 확인)
      // - outgoing: 클라이언트 → 서버 (4초)
      // - incoming: 서버 → 클라이언트 (4초)
      heartbeatOutgoing: config.heartbeatOutgoing ?? 4000,
      heartbeatIncoming: config.heartbeatIncoming ?? 4000,

      // 연결 성공 콜백
      onConnect: () => {
        console.log("[STOMP] ✅ 연결 성공!");
        setConnectionState("connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      },

      // 연결 해제 콜백
      onDisconnect: () => {
        console.log("[STOMP] ❌ 연결 해제됨");
        setConnectionState("disconnected");
        setIsConnected(false);
      },

      // STOMP 에러 콜백
      onStompError: (frame) => {
        console.error("[STOMP] STOMP 에러:", frame.headers["message"]);
        console.error("[STOMP] 상세:", frame.body);
      },

      // WebSocket 에러 콜백
      onWebSocketError: (event) => {
        console.error("[STOMP] WebSocket 에러:", event);
      },

      // 재연결 시도 콜백
      onWebSocketClose: () => {
        reconnectAttempts.current++;
        console.warn(
          `[STOMP] 재연결 시도 중... (${reconnectAttempts.current}번째)`,
        );
      },
    });

    clientRef.current = client;

    // 연결 활성화
    client.activate();
  }, [config, connectionState]);

  /**
   * STOMP 연결 해제
   */
  const disconnect = useCallback(() => {
    if (!clientRef.current) {
      console.log("[STOMP] 연결이 없습니다.");
      return;
    }

    console.log("[STOMP] 연결 해제 시작...");
    setConnectionState("disconnecting");

    // 모든 구독 해제
    unsubscribeAll();

    // 연결 해제
    clientRef.current.deactivate();
    clientRef.current = null;

    setConnectionState("disconnected");
    setIsConnected(false);
    console.log("[STOMP] 연결 해제 완료");
  }, []);

  /**
   * destination 구독
   *
   * @param destination - 구독할 경로 (예: /sub/chat/room/123)
   * @param callback - 메시지 수신 시 호출될 콜백 (JSON 파싱된 객체 전달)
   * @returns 구독 정보 (unsubscribe 함수 포함)
   */
  const subscribe = useCallback(
    <T,>(
      destination: string,
      callback: (message: T) => void,
    ): StompSubscription | null => {
      if (!clientRef.current?.connected) {
        console.warn("[STOMP] 구독 실패: 연결되지 않음 -", destination);
        return null;
      }

      console.log("[STOMP] 📬 구독 시작:", destination);

      const subscription = clientRef.current.subscribe(
        destination,
        (message: IMessage) => {
          try {
            // JSON 파싱
            const parsed = JSON.parse(message.body) as T;
            console.log(`[STOMP] 📨 메시지 수신 [${destination}]:`, parsed);
            callback(parsed);
          } catch (error) {
            console.error(
              `[STOMP] 메시지 파싱 실패 [${destination}]:`,
              message.body,
              error,
            );
          }
        },
      );

      const subId = subscription.id;

      // 구독 해제 함수 저장
      subscriptionsRef.current.set(subId, () => {
        subscription.unsubscribe();
        console.log("[STOMP] 📭 구독 해제:", destination);
      });

      return {
        id: subId,
        destination,
        unsubscribe: () => {
          const unsub = subscriptionsRef.current.get(subId);
          if (unsub) {
            unsub();
            subscriptionsRef.current.delete(subId);
          }
        },
      };
    },
    [],
  );

  /**
   * 메시지 발행
   *
   * @param destination - 발행할 경로 (예: /pub/chat/message)
   * @param body - 발행할 메시지 객체 (자동으로 JSON 직렬화)
   */
  const publish = useCallback(<T,>(destination: string, body: T): void => {
    if (!clientRef.current?.connected) {
      console.warn("[STOMP] 발행 실패: 연결되지 않음 -", destination);
      return;
    }

    try {
      const jsonBody = JSON.stringify(body);
      console.log(`[STOMP] 📤 메시지 발행 [${destination}]:`, body);

      clientRef.current.publish({
        destination,
        body: jsonBody,
      });
    } catch (error) {
      console.error(
        `[STOMP] 메시지 발행 실패 [${destination}]:`,
        body,
        error,
      );
    }
  }, []);

  /**
   * 모든 구독 해제
   */
  const unsubscribeAll = useCallback(() => {
    console.log(
      `[STOMP] 모든 구독 해제 (${subscriptionsRef.current.size}개)`,
    );
    subscriptionsRef.current.forEach((unsub) => unsub());
    subscriptionsRef.current.clear();
  }, []);

  // Cleanup: 컴포넌트 언마운트 시 자동 연결 해제
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        console.log("[STOMP] 컴포넌트 언마운트 - 자동 연결 해제");
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    subscribe,
    publish,
    unsubscribeAll,
  };
}
