import { useMemo } from "react";
import { useTextChatWebSocket } from "./useTextChatWebSocket";
import { useTextChatMessageHandler } from "./useTextChatMessageHandler";
import type {
  UseTextChatMessageHandlerParams,
  UseRoomChatReturn,
} from "@/types/room/chat/textchat/types";
import { getSocketBaseUrl } from "@/utils/socketUtils";

/**
 * useRoomChat 훅 파라미터
 * useTextChatMessageHandler와 동일한 파라미터에서 textChatWebSocket만 제외
 * (훅 내부에서 생성하기 때문)
 */
export type UseRoomChatParams = Omit<UseTextChatMessageHandlerParams, "textChatWebSocket">;

/**
 * 텍스트 채팅 통합 훅
 *
 * 텍스트 채팅과 관련된 모든 로직을 통합하여 제공합니다:
 * - STOMP WebSocket 연결 관리
 * - 메시지 구독 및 수신 처리
 *
 * @param params - 훅 파라미터
 * @returns 텍스트 채팅 관련 상태 및 함수들
 */
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
