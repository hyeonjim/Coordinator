import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  StompConnectionConfig,
  UseStompConnectionReturn,
} from "@/types/room/chat/stomp";

/**
 * STOMP WebSocket 연결 관리 공통 훅
 *
 * 텍스트 채팅과 음성 채팅에서 공통으로 사용하는 STOMP 연결 로직을 제공합니다.
 * SockJS를 통해 WebSocket 폴백을 지원하며, 자동 재연결 및 heartbeat 기능을 포함합니다.
 *
 * STOMP 프로토콜 구조:
 * - 구독(Subscribe): 서버로부터 메시지 수신을 위한 경로 등록
 * - 발행(Publish): 서버로 메시지 전송
 * - Heartbeat: 연결 상태 확인을 위한 주기적 ping/pong
 *
 * @template TPayload - 서버로 전송하는 메시지 타입
 * @template TReceived - 서버로부터 수신하는 메시지 타입
 * @param config - STOMP 연결 설정
 * @returns STOMP 연결 상태 및 메시지 송수신 함수들
 */
export function useStompConnection<TPayload, TReceived>(
  config: StompConnectionConfig,
): UseStompConnectionReturn<TPayload, TReceived> {
  const { brokerUrl, subscriptionPathPrefix, publishPath, autoConnect } =
    config;

  /**
   * STOMP 클라이언트 인스턴스
   * useRef를 사용하여 리렌더링 시에도 동일한 인스턴스를 유지합니다.
   */
  const stompClientRef = useRef<Client | null>(null);

  /**
   * 현재 구독 객체
   * 방을 나가거나 다른 방으로 이동 시 구독을 해제하기 위해 저장합니다.
   */
  const subscriptionRef = useRef<StompSubscription | null>(null);

  /**
   * 현재 구독 중인 방 ID
   * 중복 구독 방지를 위해 사용합니다.
   */
  const subscribedRoomIdRef = useRef<string | null>(null);

  /**
   * STOMP 연결 상태
   * UI에서 연결 상태를 표시하거나 메시지 전송 가능 여부를 판단하는 데 사용됩니다.
   */
  const [isConnected, setIsConnected] = useState(false);

  /**
   * STOMP 클라이언트 연결 시작
   *
   * SockJS를 통해 STOMP over WebSocket 연결을 생성합니다.
   * 이미 연결되어 있으면 새 연결을 생성하지 않습니다.
   */
  const connect = useCallback(() => {
    if (stompClientRef.current?.active) {
      return;
    }

    if (!brokerUrl) {
      return;
    }

    const client = new Client({
      /**
       * WebSocket 팩토리 함수
       * SockJS를 WebSocket 대신 사용합니다.
       * SockJS는 WebSocket을 지원하지 않는 환경에서도 작동하는 폴백 메커니즘을 제공합니다.
       */
      webSocketFactory: () => new SockJS(brokerUrl),

      /** 디버그 로그 비활성화 */
      debug: () => {},

      /**
       * 재연결 설정
       * 연결이 끊어지면 5초마다 자동으로 재연결을 시도합니다.
       */
      reconnectDelay: 5000,

      /**
       * Heartbeat 설정 (밀리초 단위)
       * 서버와 클라이언트가 주기적으로 ping/pong 메시지를 교환하여 연결 상태를 확인합니다.
       */
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true);
      },

      /**
       * STOMP 프로토콜 에러 콜백
       * 연결 상태만 업데이트하고 에러 상세 정보는 무시합니다.
       */
      onStompError: () => {
        setIsConnected(false);
      },

      onWebSocketError: () => {
        setIsConnected(false);
      },

      onDisconnect: () => {
        setIsConnected(false);
      },
    });

    stompClientRef.current = client;
    client.activate();
  }, [brokerUrl]);

  /**
   * STOMP 클라이언트 연결 종료
   * 모든 구독을 해제하고 연결을 정리합니다.
   */
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    subscribedRoomIdRef.current = null;
    setIsConnected(false);
  }, []);

  /**
   * 특정 방 구독
   *
   * 백엔드가 브로드캐스트하는 메시지를 받습니다.
   * 구독 경로: {subscriptionPathPrefix}/{roomId}
   *
   * @param roomId - 방 ID
   * @param onMessage - 메시지 수신 콜백
   */
  const subscribeToRoom = useCallback(
    (roomId: string, onMessage: (message: TReceived) => void) => {
      const client = stompClientRef.current;

      if (!client || !client.connected) {
        return;
      }

      // 이미 같은 방을 구독 중이면 무시
      if (subscribedRoomIdRef.current === roomId && subscriptionRef.current) {
        return;
      }

      // 기존 구독 해제 (다른 방으로 이동하는 경우)
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      // 새 구독 시작
      const subscription = client.subscribe(
        `${subscriptionPathPrefix}/${roomId}`,
        (message) => {
          try {
            const receivedMessage: TReceived = JSON.parse(message.body);
            onMessage(receivedMessage);
          } catch {
            // 메시지 파싱 실패 시 무시
          }
        },
      );

      subscriptionRef.current = subscription;
      subscribedRoomIdRef.current = roomId;
    },
    [subscriptionPathPrefix],
  );

  /**
   * 현재 구독 중인 방 구독 해제
   */
  const unsubscribeFromRoom = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      subscribedRoomIdRef.current = null;
    }
  }, []);

  /**
   * 메시지 발행 (서버로 전송)
   *
   * 백엔드 컨트롤러의 @MessageMapping이 이 메시지를 받아 처리합니다.
   *
   * @param payload - 전송할 메시지 페이로드
   */
  const sendMessage = useCallback(
    (payload: TPayload) => {
      const client = stompClientRef.current;

      if (!client || !client.connected) {
        return;
      }

      client.publish({
        destination: publishPath,
        body: JSON.stringify(payload),
      });
    },
    [publishPath],
  );

  /**
   * 자동 연결 및 정리
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

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
