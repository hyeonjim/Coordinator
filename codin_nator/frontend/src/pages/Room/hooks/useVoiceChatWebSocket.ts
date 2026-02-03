import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  VoiceChatMessagePayload,
  VoiceChatMessageReceived,
  UseVoiceChatWebSocketReturn,
} from "@/types/chat/stomp";

/**
 * VoiceChat STOMP WebSocket 연결 관리 훅
 *
 * @param brokerUrl - STOMP broker URL (예: http://localhost:8080/ws-voice)
 * @returns WebSocket 연결 상태 및 메시지 송수신 함수들
 */
export function useVoiceChatWebSocket(
  brokerUrl: string
): UseVoiceChatWebSocketReturn {
  // STOMP 클라이언트 참조
  const stompClientReference = useRef<Client | null>(null);

  // 현재 구독 참조
  const subscriptionReference = useRef<StompSubscription | null>(null);
  // 현재 구독 중인 방 ID 참조 (중복 구독 방지)
  const currentSubRoomIdRef = useRef<string | null>(null);

  // 연결 상태
  const [isConnected, setIsConnected] = useState(false);

  /**
   * WebSocket 연결 함수
   */
  const connect = useCallback(() => {
    if (stompClientReference.current?.active) {
      console.log("✅ [VoiceChat] 이미 연결되어 있습니다.");
      return;
    }

    // SockJS 팩토리 함수 (STOMP fallback 지원)
    const socketFactory = () => new SockJS(brokerUrl);

    // STOMP 클라이언트 생성
    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,        // 5초 후 재연결 시도
      heartbeatIncoming: 4000,     // 서버로부터 heartbeat 간격
      heartbeatOutgoing: 4000,     // 서버로 heartbeat 전송 간격

      // 연결 성공 콜백
      onConnect: () => {
        console.log("🔗 [VoiceChat] WebSocket 연결 성공");
        setIsConnected(true);
      },

      // STOMP 에러 콜백
      onStompError: (frame) => {
        console.error("❌ [VoiceChat] STOMP 에러:", frame);
        setIsConnected(false);
      },

      // WebSocket 에러 콜백
      onWebSocketError: (event) => {
        console.error("❌ [VoiceChat] WebSocket 에러:", event);
      },

      // 연결 해제 콜백
      onDisconnect: () => {
        console.log("🔌 [VoiceChat] WebSocket 연결 해제");
        setIsConnected(false);
      },

      // 디버그 로그 (실제 로그가 필요하지 않으면 빈 함수 사용)
      debug: () => {},
    });

    stompClientReference.current = client;
    client.activate();
  }, [brokerUrl]);

  /**
   * WebSocket 연결 해제 함수
   */
  const disconnect = useCallback(() => {
    if (subscriptionReference.current) {
      subscriptionReference.current.unsubscribe();
      subscriptionReference.current = null;
    }

    if (stompClientReference.current) {
      stompClientReference.current.deactivate();
      stompClientReference.current = null;
    }

    setIsConnected(false);
    console.log("🔌 [VoiceChat] 연결 해제 완료");
  }, []);

  /**
   * 방 구독 함수
   *
   * @param roomId - 구독할 방 ID
   * @param onMessage - 메시지 수신 시 호출될 콜백
   */
  const subscribeToRoom = useCallback(
    (
      roomId: string,
      onMessage: (message: VoiceChatMessageReceived) => void
    ) => {
      const client = stompClientReference.current;

      if (!client || !client.connected) {
        console.warn("⚠️ [VoiceChat] 클라이언트가 연결되지 않았습니다.");
        return;
      }

      // 이미 같은 방을 구독 중이면 무시
      if (currentSubRoomIdRef.current === roomId && subscriptionReference.current) {
        console.log(`ℹ️ [VoiceChat] 이미 방 ${roomId}을(를) 구독 중입니다.`);
        return;
      }

      // 기존 구독 해제
      if (subscriptionReference.current) {
        subscriptionReference.current.unsubscribe();
      }

      // 새로운 구독 생성
      const subscription = client.subscribe(
        `/sub/voice/room/${roomId}`,
        (message) => {
          try {
            const receivedMessage: VoiceChatMessageReceived = JSON.parse(
              message.body
            );
            console.log("📩 [VoiceChat] 메시지 수신:", receivedMessage);
            onMessage(receivedMessage);
          } catch (error) {
            console.error("❌ [VoiceChat] 메시지 파싱 에러:", error);
          }
        }
      );

      subscriptionReference.current = subscription;
      currentSubRoomIdRef.current = roomId;
      console.log(`✅ [VoiceChat] 방 ${roomId} 구독 완료`);
    },
    []
  );

  /**
   * 방 구독 해제 함수
   */
  const unsubscribeFromRoom = useCallback(() => {
    if (subscriptionReference.current) {
      subscriptionReference.current.unsubscribe();
      subscriptionReference.current = null;
      currentSubRoomIdRef.current = null;
      console.log("🔕 [VoiceChat] 방 구독 해제");
    }
  }, []);

  /**
   * 메시지 전송 함수
   *
   * @param payload - 전송할 메시지 페이로드
   */
  const sendMessage = useCallback((payload: VoiceChatMessagePayload) => {
    const client = stompClientReference.current;

    if (!client || !client.connected) {
      console.warn("⚠️ [VoiceChat] 연결되지 않아 메시지를 전송할 수 없습니다.");
      return;
    }

    client.publish({
      destination: "/pub/voice/message",
      body: JSON.stringify(payload),
    });

    console.log("📤 [VoiceChat] 메시지 전송:", payload);
  }, []);

  // 컴포넌트 마운트 시 연결, 언마운트 시 해제
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

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
    ]
  );
}
