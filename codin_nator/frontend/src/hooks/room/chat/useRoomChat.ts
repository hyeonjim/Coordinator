/**
 * useRoomChat.ts - 텍스트 채팅 통합 훅
 *
 * [이 훅의 역할]
 * 텍스트 채팅에 필요한 두 가지 하위 훅을 조합합니다:
 * 1. useTextChatWebSocket: STOMP WebSocket 연결 관리
 * 2. useTextChatMessageHandler: 수신 메시지 처리 및 구독 관리
 *
 * [파사드(Facade) 패턴]
 * - 여러 복잡한 하위 시스템(WebSocket 연결 + 메시지 처리)을
 *   하나의 간단한 인터페이스로 통합하는 디자인 패턴
 * - 사용하는 쪽에서는 useRoomChat 하나만 호출하면 됨
 *
 * [Omit 타입 유틸리티]
 * - TypeScript의 내장 유틸리티 타입
 * - Omit<T, K>: T 타입에서 K 속성을 제외한 새 타입 생성
 * - 여기서는 textChatWebSocket을 제외 (내부에서 생성하므로 외부에서 받을 필요 없음)
 */
import { useMemo } from "react";
import { useTextChatWebSocket } from "./useTextChatWebSocket";
import { useTextChatMessageHandler } from "./useTextChatMessageHandler";
import type {
  UseTextChatMessageHandlerParams,
  UseRoomChatReturn,
} from "@/types/chat";
import { getSocketBaseUrl } from "@/utils/socketUtils";

/**
 * useRoomChat 훅 파라미터
 * useTextChatMessageHandler와 동일한 파라미터에서 textChatWebSocket만 제외
 * (훅 내부에서 생성하기 때문)
 */
export type UseRoomChatParams = Omit<UseTextChatMessageHandlerParams, "textChatWebSocket">;
export function useRoomChat({
  currentRoomId,
  userName,
  isJoined,
  setChatMessages,
}: UseRoomChatParams): UseRoomChatReturn {
  // 텍스트 채팅 STOMP WebSocket 연결
  const textChatWebSocket = useTextChatWebSocket(
    `${getSocketBaseUrl()}/ws-chat`,
  );

  // 메시지 수신 처리
  useTextChatMessageHandler({
    textChatWebSocket,
    currentRoomId,
    userName,
    isJoined,
    setChatMessages,
  });

  return useMemo(
    () => ({ textChatWebSocket }),
    [textChatWebSocket],
  );
}
