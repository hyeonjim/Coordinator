import { useMemo } from "react";
import { useStompConnection } from "./stomp/useStompConnection";
import type {
  TextChatMessagePayload,
  TextChatMessageReceived,
  UseTextChatWebSocketReturn,
} from "@/types/room/chat/textchat/types";

/**
 * 텍스트 채팅 전용 STOMP WebSocket 훅
 * 백엔드 STOMP 서버 구조:
 * - 엔드포인트: /ws-chat
 * - 구독 경로: /sub/chat/room/{roomId}
 * - 발행 경로: /pub/chat/message
 * - 메시지 타입: ENTER(입장), TALK(채팅), LEAVE(퇴장)
 *
 * @param brokerUrl - STOMP 브로커 URL (예: http://localhost:8080/ws-chat)
 * @returns STOMP 연결 상태와 메시지 송수신 함수들
 */
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
