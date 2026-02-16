/**
 * useStompConnection.ts - 범용 STOMP over WebSocket 연결 관리 훅
 *
 * [STOMP (Simple Text Oriented Messaging Protocol) 란?]
 * - WebSocket 위에서 동작하는 메시징 프로토콜입니다.
 * - WebSocket은 단순히 "바이트를 주고받는 파이프"인데, STOMP는 그 위에
 *   "구독/발행(Pub/Sub)" 패턴을 추가하여 체계적인 메시지 전달을 가능하게 합니다.
 * - 비유: WebSocket = 전화선, STOMP = 전화기 (프로토콜을 제공)
 *
 * [STOMP over WebSocket 흐름]
 * 1. SockJS로 WebSocket 연결 생성 (폴백: HTTP long-polling)
 *    → SockJS: WebSocket을 지원하지 않는 브라우저/네트워크에서도 동작하는 라이브러리
 * 2. STOMP 클라이언트가 WebSocket 위에서 프레임 기반 통신
 *    → 프레임: COMMAND(명령) + HEADERS(헤더) + BODY(본문) 구조
 * 3. CONNECT → 서버와 STOMP 세션 수립
 * 4. SUBSCRIBE → 특정 주제(Topic/Destination)를 구독
 *    → 예: /sub/chat/room/123 구독 → 123번 방의 채팅 메시지 수신
 * 5. SEND → 서버에 메시지 발행
 *    → 예: /pub/chat/message로 메시지 전송 → 서버가 구독자들에게 브로드캐스트
 * 6. MESSAGE → 구독한 주제의 메시지 수신
 *
 * [Pub/Sub (발행/구독) 패턴이란?]
 * - 발행자(Publisher)가 특정 주제(Topic)에 메시지를 보내면
 *   해당 주제를 구독(Subscribe)한 모든 클라이언트가 메시지를 받는 패턴
 * - 발행자와 구독자가 서로를 직접 알 필요 없음 (느슨한 결합)
 * - 채팅방 예시: 방에 메시지를 보내면 같은 방을 구독한 모든 사용자가 받음
 *
 * [이 훅의 설계]
 * - 제네릭 타입 <TPayload, TReceived>으로 텍스트/음성 채팅 모두에서 재사용 가능
 * - 자동 재연결(reconnectDelay)과 heartbeat로 안정적인 연결 유지
 * - 구독/발행/연결/해제 등 STOMP 핵심 기능을 React 훅 인터페이스로 제공
 *
 * @template TPayload - 서버로 전송하는 메시지 타입
 * @template TReceived - 서버로부터 수신하는 메시지 타입
 * @param config - STOMP 연결 설정
 * @returns STOMP 연결 상태 및 메시지 송수신 함수들
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  StompConnectionConfig,
  UseStompConnectionReturn,
} from "@/types/chat";
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
   * [자동 연결 및 정리 - useEffect 라이프사이클]
   *
   * useEffect의 동작:
   * 1. 마운트 시: autoConnect가 true면 자동으로 STOMP 연결 시작
   * 2. 언마운트 시(return 함수): disconnect()로 연결 정리
   *
   * [cleanup 함수란?]
   * - useEffect에서 return하는 함수는 "정리(cleanup)" 함수라고 합니다.
   * - 컴포넌트가 화면에서 사라질 때(언마운트) 또는 의존성이 변경되어
   *   effect가 다시 실행되기 전에 호출됩니다.
   * - 이를 통해 WebSocket 연결, 타이머, 이벤트 리스너 등을 정리하여
   *   메모리 누수를 방지합니다.
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
