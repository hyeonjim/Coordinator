import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  TextChatMessagePayload,
  TextChatMessageReceived,
  UseTextChatWebSocketReturn,
} from "@/types/room/chat/stomp";

/**
 * 텍스트 채팅 전용 STOMP WebSocket 훅
 *
 * WebRTC 시그널링(useWebSocket)과는 완전히 분리된 독립적인 연결입니다.
 * - WebRTC 시그널링: 순수 WebSocket 사용 (음성 채팅 연결 협상용)
 * - 텍스트 채팅: STOMP over SockJS 사용 (이 훅)
 *
 * 백엔드 STOMP 서버 구조:
 * - 엔드포인트: /ws-chat
 * - 구독 경로: /sub/chat/room/{roomId}
 * - 발행 경로: /pub/chat/message
 * - 메시지 타입: ENTER(입장), TALK(채팅)
 *
 * @param brokerUrl - STOMP 브로커 URL (예: http://localhost:8080/ws-chat)
 * @returns STOMP 연결 상태와 메시지 송수신 함수들
 */
export function useTextChatWebSocket(
  brokerUrl: string,
): UseTextChatWebSocketReturn {
  /**
   * STOMP 클라이언트 인스턴스
   * useRef를 사용하여 리렌더링 시에도 동일한 인스턴스를 유지합니다.
   */
  const stompClientRef = useRef<Client | null>(null);

  /**
   * 현재 구독 객체
   * 방을 나가거나 다른 방으로 이동 시 구독을 해제하기 위해 저장합니다.
   */
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  /** 현재 구독 중인 방 ID (중복 구독 방지) */
  const currentSubRoomIdRef = useRef<string | null>(null);

  /**
   * STOMP 연결 상태
   * UI에서 연결 상태를 표시하거나 메시지 전송 가능 여부를 판단하는 데 사용됩니다.
   */
  const [isConnected, setIsConnected] = useState(false);

  /**
   * STOMP 클라이언트 연결 시작
   * SockJS를 통해 STOMP over WebSocket 연결을 생성합니다.
   *
   * 이미 연결되어 있으면 새 연결을 생성하지 않습니다.
   */
  const connect = useCallback(() => {
    // 이미 연결되어 있으면 무시
    if (stompClientRef.current?.connected) {
      console.log("🔄 이미 텍스트 채팅 STOMP에 연결되어 있습니다.");
      return;
    }

    // URL 검증
    if (!brokerUrl) {
      console.warn("⚠️ STOMP 브로커 URL이 설정되지 않았습니다.");
      return;
    }

    // SockJS를 사용하는 STOMP 클라이언트 생성
    const client = new Client({
      /**
       * WebSocket 팩토리 함수
       * SockJS를 WebSocket 대신 사용합니다. (백엔드 설정과 일치)
       * SockJS는 WebSocket을 지원하지 않는 환경에서도 작동하는 폴백 메커니즘을 제공합니다.
       */
      webSocketFactory: () => new SockJS(brokerUrl),

      /**
       * 디버그 로그 (실제 로그가 필요하지 않으면 빈 함수 사용)
       */
      debug: () => {},

      /**
       * 재연결 설정
       * 연결이 끊어지면 5초마다 자동으로 재연결을 시도합니다.
       */
      reconnectDelay: 5000,

      /**
       * Heartbeat 설정 (밀리초 단위)
       * 서버와 클라이언트가 주기적으로 ping/pong 메시지를 교환하여 연결 상태를 확인합니다.
       * - heartbeatIncoming: 서버로부터 heartbeat를 받는 간격
       * - heartbeatOutgoing: 서버로 heartbeat를 보내는 간격
       */
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      /**
       * 연결 성공 콜백
       * STOMP 프로토콜 연결이 완료되면 호출됩니다.
       */
      onConnect: () => {
        console.log("✅ 텍스트 채팅 STOMP 연결 성공");
        setIsConnected(true);
      },

      /**
       * STOMP 프로토콜 에러 콜백
       * STOMP 레벨에서 발생한 에러를 처리합니다.
       * (예: 인증 실패, 잘못된 프레임 형식 등)
       *
       * unknown 타입 사용 이유:
       * @stomp/stompjs의 Frame 타입이 복잡하고 일관성이 없어,
       * 실무에서는 에러 로깅 용도로만 사용하므로 unknown 타입 사용
       */
      onStompError: (frame: unknown) => {
        console.error("❌ STOMP 에러:", frame);
        setIsConnected(false);
      },

      /**
       * WebSocket 레벨 에러 콜백
       * WebSocket 연결 자체에서 발생한 에러를 처리합니다.
       * (예: 네트워크 문제, 서버 다운 등)
       */
      onWebSocketError: (event: Event) => {
        console.error("❌ WebSocket 에러:", event);
        setIsConnected(false);
      },

      /**
       * 연결 종료 콜백
       * 정상적인 연결 해제 또는 비정상 종료 시 호출됩니다.
       */
      onDisconnect: () => {
        console.log("🔌 텍스트 채팅 STOMP 연결 해제");
        setIsConnected(false);
      },
    });

    // 클라이언트 저장 및 연결 시작
    stompClientRef.current = client;
    client.activate();
  }, [brokerUrl]);

  /**
   * STOMP 클라이언트 연결 종료
   * 모든 구독을 해제하고 연결을 정리합니다.
   */
  const disconnect = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      subscriptionRef.current = null;
      console.log("🔌 STOMP 연결 종료 및 정리 완료");
    }
  }, []);

  /**
   * 특정 채팅방 구독
   * 백엔드가 브로드캐스트하는 메시지를 받습니다.
   *
   * 구독 경로: /sub/chat/room/{roomId}
   * 이 경로로 전송되는 모든 메시지가 onMessage 콜백으로 전달됩니다.
   *
   * @param roomId - 채팅방 ID
   * @param onMessage - 메시지 수신 콜백
   */
  const subscribeToRoom = useCallback(
    (roomId: string, onMessage: (message: TextChatMessageReceived) => void) => {
      const client = stompClientRef.current;

      // 연결 확인
      if (!client || !client.connected) {
        console.warn(
          "⚠️ STOMP가 연결되지 않았습니다. 먼저 connect()를 호출하세요.",
        );
        return;
      }

      // 이미 같은 방을 구독 중이면 무시
      if (currentSubRoomIdRef.current === roomId && subscriptionRef.current) {
        console.log(`ℹ️ 이미 텍스트 채팅방 ${roomId}을(를) 구독 중입니다.`);
        return;
      }

      // 기존 구독 해제 (다른 방으로 이동하는 경우)
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        console.log("📢 이전 채팅방 구독 해제");
      }

      // 새 구독 시작
      // 구독 경로: /sub/chat/room/{roomId}
      const subscription = client.subscribe(
        `/sub/chat/room/${roomId}`,
        (message) => {
          try {
            // 메시지 본문을 JSON으로 파싱
            const receivedMessage: TextChatMessageReceived = JSON.parse(
              message.body,
            );
            console.log("💬 채팅 메시지 수신:", receivedMessage);

            // 콜백 함수 호출
            onMessage(receivedMessage);
          } catch (error) {
            console.error("❌ 메시지 파싱 에러:", error);
          }
        },
      );

      subscriptionRef.current = subscription;
      currentSubRoomIdRef.current = roomId;
      console.log(`📢 채팅방 구독 시작: ${roomId}`);
    },
    [],
  );

  /**
   * 현재 구독 중인 채팅방 구독 해제
   * 방을 나가거나 다른 방으로 이동할 때 호출합니다.
   */
  const unsubscribeFromRoom = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      currentSubRoomIdRef.current = null;
      console.log("📢 채팅방 구독 해제");
    }
  }, []);

  /**
   * 메시지 발행 (서버로 전송)
   * 발행 경로: /pub/chat/message
   *
   * 백엔드 컨트롤러의 @MessageMapping("/chat/message")가 이 메시지를 받아 처리합니다.
   *
   * @param payload - 전송할 메시지 페이로드
   */
  const sendMessage = useCallback((payload: TextChatMessagePayload) => {
    const client = stompClientRef.current;

    // 연결 확인
    if (!client || !client.connected) {
      console.warn(
        "⚠️ STOMP가 연결되지 않았습니다. 메시지를 전송할 수 없습니다.",
      );
      return;
    }

    // 메시지 발행
    // destination: 백엔드 컨트롤러의 @MessageMapping 경로
    // body: JSON 문자열로 변환된 페이로드
    client.publish({
      destination: "/pub/chat/message",
      body: JSON.stringify(payload),
    });

    console.log("📤 채팅 메시지 전송:", payload);
  }, []);

  /**
   * 컴포넌트 언마운트 시 정리
   * 메모리 누수 방지를 위해 연결을 해제합니다.
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return useMemo(
    () => ({
      isConnected,
      subscribeToRoom,
      unsubscribeFromRoom,
      sendMessage,
      connect,
      disconnect,
    }),
    [
      isConnected,
      subscribeToRoom,
      unsubscribeFromRoom,
      sendMessage,
      connect,
      disconnect,
    ],
  );
}
