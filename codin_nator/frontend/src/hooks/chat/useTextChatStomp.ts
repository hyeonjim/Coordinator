import { useEffect, useState, useCallback, useRef } from "react";
import { useStompClient } from "./useStompClient";
import { useParticipantStore } from "@/stores/participantStore";
import {
  toBackendTextChatMessage,
  fromBackendTextChatMessage,
  createEnterMessage,
} from "@/utils/chat/chatAdapter";
import type { BackendTextChatMessage } from "@/types/chat/backendDto";
import type { ChatMessage, UseTextChatStompReturn } from "@/types/chat/message";

/**
 * 텍스트 채팅 STOMP 훅
 *
 * 역할:
 * - STOMP를 통한 텍스트 채팅 메시지 송수신
 * - 백엔드 DTO ↔ 프론트엔드 타입 자동 변환
 * - 메시지 히스토리 관리
 *
 * 동작 흐름:
 * 1. STOMP 연결
 * 2. /sub/chat/room/{roomId} 구독
 * 3. 메시지 수신 시 어댑터로 변환 후 목록에 추가
 * 4. 메시지 전송 시 어댑터로 변환 후 /pub/chat/message로 발행
 *
 * @param roomId - 채팅방 ID
 * @param userId - 현재 사용자 ID
 * @param userName - 현재 사용자 이름
 *
 * @example
 * ```typescript
 * const chat = useTextChatStomp('room123', 'user1', '홍길동');
 *
 * // 메시지 전송
 * chat.sendMessage('안녕하세요');
 *
 * // 입장 알림
 * chat.sendEnter();
 *
 * // 메시지 목록
 * chat.messages.map(msg => <div>{msg.message}</div>);
 * ```
 */
export function useTextChatStomp(
  roomId: string,
  userId: string,
  userName: string,
): UseTextChatStompReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasJoinedRef = useRef(false);

  // 참여자 스토어
  const { getParticipant } = useParticipantStore();

  // WebSocket URL 설정 (개발/프로덕션 자동 감지)
  const chatWsUrl = import.meta.env.DEV
    ? "ws://localhost:8080/ws-chat"
    : "wss://i14e205.p.ssafy.io/ws-chat";

  // STOMP 클라이언트
  const stomp = useStompClient({
    brokerURL: chatWsUrl,
    debug: import.meta.env.DEV, // 개발 환경에서만 디버그
    reconnectDelay: 5000,
  });

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(
    (message: string) => {
      if (!stomp.isConnected) {
        console.warn("[TextChatStomp] ⚠️ 연결되지 않음 - 메시지 전송 불가");
        return;
      }

      if (!message.trim()) {
        console.warn("[TextChatStomp] ⚠️ 빈 메시지는 전송할 수 없습니다");
        return;
      }

      // 백엔드 형식으로 변환
      const backendMessage = toBackendTextChatMessage(message, userId, roomId);

      // STOMP 발행
      stomp.publish("/pub/chat/message", backendMessage);

      console.log("[TextChatStomp] 📤 메시지 전송:", message);
    },
    [stomp, userId, roomId],
  );

  /**
   * 입장 메시지 전송
   */
  const sendEnter = useCallback(() => {
    if (!stomp.isConnected) {
      console.warn("[TextChatStomp] ⚠️ 연결되지 않음 - 입장 메시지 전송 불가");
      return;
    }

    const enterMessage = createEnterMessage(userId, userName, roomId);
    stomp.publish("/pub/chat/message", enterMessage);

    console.log("[TextChatStomp] 📥 입장 메시지 전송:", userName);
  }, [stomp, userId, userName, roomId]);

  // STOMP 연결
  useEffect(() => {
    console.log("[TextChatStomp] 🔌 연결 시작:", chatWsUrl);
    stomp.connect();

    return () => {
      console.log("[TextChatStomp] 🔌 연결 해제");
      stomp.disconnect();
      hasJoinedRef.current = false;
    };
  }, [chatWsUrl, stomp]);

  // 메시지 구독
  useEffect(() => {
    if (!stomp.isConnected || !roomId) {
      return;
    }

    const destination = `/sub/chat/room/${roomId}`;
    console.log("[TextChatStomp] 📬 구독 시작:", destination);

    const subscription = stomp.subscribe<BackendTextChatMessage>(
      destination,
      (backendMessage) => {
        // 백엔드 메시지 → 프론트엔드 메시지 변환
        const chatMessage = fromBackendTextChatMessage(
          backendMessage,
          getParticipant,
          userId,
        );

        // 메시지 목록에 추가
        setMessages((prev) => [...prev, chatMessage]);
      },
    );

    // 구독 성공 후 입장 메시지 전송 (한 번만)
    if (!hasJoinedRef.current) {
      // 약간의 지연 후 전송 (구독 완료 보장)
      setTimeout(() => {
        sendEnter();
        hasJoinedRef.current = true;
      }, 300);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [stomp, roomId, getParticipant, userId, sendEnter]);

  return {
    isConnected: stomp.isConnected,
    sendMessage,
    sendEnter,
    messages,
    clearMessages: () => setMessages([]),
  };
}
