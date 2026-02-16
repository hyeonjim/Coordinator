/**
 * useTextChatWebSocket.ts - 텍스트 채팅 전용 STOMP WebSocket 훅
 *
 * [이 훅의 역할]
 * - useStompConnection 범용 훅을 텍스트 채팅 전용으로 설정하는 래퍼(wrapper) 훅
 * - 음성 채팅(useVoiceChatWebSocket)과 동일한 STOMP 훅을 사용하지만,
 *   경로와 메시지 타입이 다릅니다.
 *
 * [래퍼(Wrapper) 훅 패턴]
 * - 범용 훅을 특정 용도로 미리 설정하여 사용하기 편하게 만드는 패턴
 * - 코드 재사용성 향상 + 사용처에서의 복잡도 감소
 *
 * [백엔드 STOMP 서버 구조]
 * - 엔드포인트: /ws-chat (SockJS WebSocket 접속 주소)
 * - 구독 경로: /sub/chat/room/{roomId} (방별 채팅 메시지 수신)
 * - 발행 경로: /pub/chat/message (채팅 메시지 전송)
 * - 메시지 타입: ENTER(입장), TALK(채팅), LEAVE(퇴장)
 *
 * [음성 채팅 vs 텍스트 채팅 STOMP 비교]
 * - 음성: autoConnect=true (방 진입 시 자동 연결, 시그널링 준비)
 * - 텍스트: autoConnect=false (사용자가 "참여하기" 누를 때 수동 연결)
 *
 * @param brokerUrl - STOMP 브로커 URL (예: http://localhost:8080/ws-chat)
 * @returns STOMP 연결 상태와 메시지 송수신 함수들
 */
import { useMemo } from "react";
import { useStompConnection } from "./stomp/useStompConnection";
import type {
  TextChatMessagePayload,
  TextChatMessageReceived,
  UseTextChatWebSocketReturn,
} from "@/types/chat";
export function useTextChatWebSocket(
  brokerUrl: string,
): UseTextChatWebSocketReturn {
  const stompConnection = useStompConnection<
    TextChatMessagePayload,
    TextChatMessageReceived
  >({
    brokerUrl,
    subscriptionPathPrefix: "/sub/chat/room",
    publishPath: "/pub/chat/message",
    autoConnect: false,
  });

  return useMemo(
    () => ({
      isConnected: stompConnection.isConnected,
      subscribeToRoom: stompConnection.subscribeToRoom,
      unsubscribeFromRoom: stompConnection.unsubscribeFromRoom,
      sendMessage: stompConnection.sendMessage,
      connect: stompConnection.connect,
      disconnect: stompConnection.disconnect,
    }),
    [stompConnection],
  );
}
