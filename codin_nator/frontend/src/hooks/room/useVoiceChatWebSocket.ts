import { useMemo } from "react";
import { useStompConnection } from "./stomp/useStompConnection";
import type {
  VoiceChatMessagePayload,
  VoiceChatMessageReceived,
  UseVoiceChatWebSocketReturn,
} from "@/types/room/chat/voicechat/types";

/**
 * 음성 채팅 STOMP WebSocket 훅
 *
 * WebRTC 시그널링 메시지 교환을 위한 STOMP 연결입니다.
 * 실제 음성 데이터는 WebRTC P2P로 직접 전송되며,
 * 이 훅은 연결 협상(Offer/Answer/ICE)을 위해 사용됩니다.
 *
 * 백엔드 STOMP 서버 구조:
 * - 엔드포인트: /ws-voice
 * - 구독 경로: /sub/voice/room/{roomId}
 * - 발행 경로: /pub/voice/message
 * - 메시지 타입: JOIN, OFFER, ANSWER, ICE, MIC, LEAVE, PEER_LIST, IDENTITY
 *
 * @param brokerUrl - STOMP 브로커 URL (예: http://localhost:8080/ws-voice)
 * @returns STOMP 연결 상태와 메시지 송수신 함수들
 */
export function useVoiceChatWebSocket(
  brokerUrl: string,
): UseVoiceChatWebSocketReturn {
  const stompConnection = useStompConnection<
    VoiceChatMessagePayload,
    VoiceChatMessageReceived
  >({
    brokerUrl,
    subscriptionPathPrefix: "/sub/voice/room",
    publishPath: "/pub/voice/message",
    autoConnect: true,
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
