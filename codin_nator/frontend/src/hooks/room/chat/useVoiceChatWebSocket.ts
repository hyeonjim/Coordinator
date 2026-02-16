/**
 * useVoiceChatWebSocket.ts - WebRTC 시그널링을 위한 STOMP WebSocket 훅
 *
 * [이 훅의 역할]
 * - WebRTC P2P 연결을 수립하기 위한 "시그널링 채널" 역할
 * - 실제 음성 데이터는 WebRTC로 P2P 직접 전송되지만,
 *   연결 협상 메시지(Offer/Answer/ICE)는 서버를 경유해야 합니다.
 * - 이 훅이 그 경유 채널(STOMP WebSocket)을 제공합니다.
 *
 * [왜 시그널링이 필요한가?]
 * - WebRTC는 P2P이지만, 처음 연결할 때는 상대방의 주소를 모름
 * - 서버(STOMP)를 통해 "나와 연결하려면 이 정보를 사용해" 라고 알려줘야 함
 * - 연결이 수립된 후에는 서버 없이 직접 통신
 *
 * [백엔드 STOMP 서버 구조]
 * - 엔드포인트: /ws-voice (SockJS WebSocket 접속 주소)
 * - 구독 경로: /sub/voice/room/{roomId} (방별 시그널링 메시지 수신)
 * - 발행 경로: /pub/voice/message (시그널링 메시지 전송)
 * - 메시지 타입: JOIN, OFFER, ANSWER, ICE, MIC, LEAVE, PEER_LIST, IDENTITY
 *
 * [useMemo란?]
 * - 계산 결과를 캐싱하여 의존성이 바뀌지 않으면 이전 결과를 재사용
 * - 여기서는 반환 객체의 참조를 안정적으로 유지하여 불필요한 리렌더링 방지
 *
 * @param brokerUrl - STOMP 브로커 URL (예: http://localhost:8080/ws-voice)
 * @returns STOMP 연결 상태와 메시지 송수신 함수들
 */
import { useMemo } from "react";
import { useStompConnection } from "./stomp/useStompConnection";
import type {
  VoiceChatMessagePayload,
  VoiceChatMessageReceived,
  UseVoiceChatWebSocketReturn,
} from "@/types/voice";
export function useVoiceChatWebSocket(
  brokerUrl: string,
): UseVoiceChatWebSocketReturn {
  /**
   * useStompConnection: 범용 STOMP 연결 훅을 음성 채팅용으로 설정
   * - 제네릭 타입 <VoiceChatMessagePayload, VoiceChatMessageReceived>:
   *   → 전송(Payload)과 수신(Received) 메시지의 타입을 명시 (TypeScript 타입 안전성)
   * - autoConnect: true → 훅이 마운트되면 자동으로 STOMP 연결 시작
   *   (음성 채팅은 방 입장 전에 미리 연결해둠)
   */
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
