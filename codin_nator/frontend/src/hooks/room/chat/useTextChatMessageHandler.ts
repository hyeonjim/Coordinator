/**
 * useTextChatMessageHandler.ts - 텍스트 채팅 메시지 수신 및 처리 훅
 *
 * [이 훅의 역할]
 * STOMP로 수신된 텍스트 채팅 메시지를 처리하여 React 상태(chatMessages)에 추가합니다.
 *
 * [동작 순서]
 * 1. 방 입장 시 (isJoined === true) 자동으로 채팅방 STOMP 구독 시작
 * 2. 메시지 수신 시 중복 체크 및 UI 형태(ChatMessage)로 변환
 * 3. 방 퇴장 또는 컴포넌트 언마운트 시 구독 해제
 *
 * [중복 메시지 방지 - 낙관적 업데이트(Optimistic Update) 패턴]
 * - 내가 메시지를 보낼 때: 서버 응답을 기다리지 않고 즉시 로컬에 추가 (handleSendChat)
 * - 서버가 같은 메시지를 브로드캐스트할 때: 이미 로컬에 있으므로 무시
 * - ENTER/LEAVE 메시지는 서버가 생성하므로 항상 추가
 *
 * [useEffect란?]
 * - 컴포넌트 렌더링 후 실행되는 "부수 효과(side effect)" 함수
 * - 여기서는 STOMP 구독/해제라는 부수 효과를 관리
 * - 의존성 배열의 값이 변경될 때마다 이전 cleanup → 새 effect 순으로 실행
 *
 * @param params - 훅 파라미터
 */
import { useEffect } from "react";
import type {
  ChatMessage,
  UseTextChatMessageHandlerParams,
} from "@/types/chat";
import { generateId } from "@/utils/room/idGenerator";
export function useTextChatMessageHandler({
  textChatWebSocket,
  currentRoomId,
  userName,
  isJoined,
  setChatMessages,
}: UseTextChatMessageHandlerParams) {
  useEffect(() => {
    // 방에 입장하지 않았으면 구독하지 않음
    if (!isJoined || !currentRoomId) {
      return;
    }

    // STOMP가 연결되지 않았으면 대기
    // connect()가 완료되면 이 effect가 다시 실행됩니다.
    if (!textChatWebSocket.isConnected) {
      return;
    }

    /**
     * 채팅방 구독 시작
     * 백엔드의 /sub/chat/room/{roomId} 경로를 구독합니다.
     */
    textChatWebSocket.subscribeToRoom(currentRoomId, (receivedMessage) => {
      /**
       * 중복 메시지 방지
       *
       * 내가 보낸 TALK 메시지는 이미 handleSendChat에서 로컬에 추가했으므로,
       * 서버로부터 브로드캐스트된 같은 메시지를 다시 추가하면 중복됩니다.
       *
       * 조건:
       * - sender가 내 이름과 같고
       * - 메시지 타입이 TALK인 경우
       * → 무시 (이미 로컬에 있음)
       *
       * 반대로 ENTER, LEAVE 메시지는 로컬에 추가하지 않았으므로 모두 표시합니다.
       */
      if (
        receivedMessage.sender === userName &&
        receivedMessage.type === "TALK"
      ) {
        return;
      }

      /**
       * 수신한 메시지를 UI 형태로 변환
       *
       * 백엔드 DTO (TextChatMessageReceived):
       * - 이제 imageUrl과 timestamp가 포함됨!
       */
      const chatMessage: ChatMessage = {
        id: generateId("message"),
        userId: receivedMessage.sender,
        userName: receivedMessage.sender,
        message: receivedMessage.message,
        timestamp: receivedMessage.timestamp ?? Date.now(),
        isMe: receivedMessage.sender === userName,
        imageUrl: receivedMessage.imageUrl,
      };

      /**
       * 채팅 메시지 목록에 추가
       * React state 업데이트 함수의 콜백 형태를 사용하여
       * 최신 상태를 기반으로 업데이트합니다.
       */
      setChatMessages((previousMessages) => [...previousMessages, chatMessage]);
    });

    /**
     * 컴포넌트 언마운트 또는 방 이동 시 구독 해제
     *
     * useEffect의 cleanup 함수는 다음 경우에 호출됩니다:
     * 1. 컴포넌트가 언마운트될 때
     * 2. 의존성 배열의 값이 변경되어 effect가 다시 실행되기 전
     *
     * 이를 통해 불필요한 메시지 수신을 방지하고 메모리 누수를 예방합니다.
     */
    return () => {
      textChatWebSocket.unsubscribeFromRoom();
    };
  }, [textChatWebSocket, currentRoomId, userName, isJoined, setChatMessages]);
}
