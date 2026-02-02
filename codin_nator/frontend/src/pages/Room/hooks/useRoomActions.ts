import { useCallback } from "react";
import type { UseRoomActionsParams } from "@/types/room/types";
import { generateId } from "@/utils/room/idGenerator";

/**
 * 방 입장/퇴장 및 채팅 전송 훅
 * 방과 관련된 주요 액션들을 관리합니다.
 *
 * @param params - 훅 파라미터
 * @returns 방 액션 함수들 (handleJoin, handleLeave, handleSendChat)
 */
export function useRoomActions({
  currentRoomId,
  userId,
  userName,
  userImageUrl,
  webRTC,
  webSocket,
  textChatWebSocket,
  setIsJoined,
  setParticipants,
  setChatMessages,
  navigate,
}: UseRoomActionsParams) {
  /**
   * 방에 입장합니다.
   * 1. 마이크 권한 요청 및 오디오 스트림 시작
   * 2. WebSocket 연결 (WebRTC 시그널링용)
   * 3. STOMP 연결 (텍스트 채팅용)
   * 4. 입장 메시지 전송 (WebRTC + 텍스트 채팅)
   */
  const handleJoin = useCallback(async () => {
    if (!currentRoomId) return;

    try {
      // 1. 마이크 권한 요청 및 오디오 스트림 시작
      await webRTC.startAudio();

      // 2. WebSocket 연결 (WebRTC 시그널링용 - 음성 채팅)
      webSocket.connect();

      // 3. STOMP 연결 (텍스트 채팅용)
      textChatWebSocket.connect();

      setTimeout(() => {
        // 4-1. WebRTC 시그널링 입장 메시지 (기존 방식 유지)
        webSocket.send({
          type: "join",
          roomId: currentRoomId,
          userId,
          userName,
          imageUrl: userImageUrl,
        });

        // 4-2. 텍스트 채팅 입장 메시지 (STOMP)
        // message를 빈 문자열로 전송하면, 서버가 "{sender}님이 입장하셨습니다."로 자동 생성
        textChatWebSocket.sendMessage({
          roomId: currentRoomId,
          sender: userName,
          message: "",
          type: "ENTER",
          imageUrl: userImageUrl,
        });

        setIsJoined(true);
      }, 300);
    } catch (error) {
      console.error("입장 실패:", error);
      alert(
        "마이크 권한을 허용해주셔야 음성 채팅 서비스를 이용하실 수 있습니다.",
      );
    }
  }, [
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    webRTC,
    webSocket,
    textChatWebSocket,
    setIsJoined,
  ]);

  /**
   * 방에서 퇴장합니다.
   * 1. 퇴장 메시지 전송 (WebRTC 시그널링)
   * 2. 오디오 스트림 정지
   * 3. WebSocket 연결 종료 (WebRTC + 텍스트 채팅)
   * 4. 상태 초기화
   * 5. 홈 화면으로 이동
   */
  const handleLeave = useCallback(() => {
    // 1. WebRTC 시그널링 퇴장 메시지 (기존)
    webSocket.send({ type: "leave", roomId: currentRoomId, userId });

    // 2. 오디오 스트림 정지
    webRTC.stopAudio();

    // 3. WebSocket 연결 종료
    webSocket.disconnect(); // WebRTC 시그널링
    textChatWebSocket.disconnect(); // 텍스트 채팅 STOMP

    // 4. 상태 초기화
    setIsJoined(false);
    setParticipants([]);
    setChatMessages([]);

    // 5. 홈 화면으로 이동
    navigate("/home", { replace: true });
  }, [
    currentRoomId,
    userId,
    webRTC,
    webSocket,
    textChatWebSocket,
    setIsJoined,
    setParticipants,
    setChatMessages,
    navigate,
  ]);

  /**
   * 텍스트 채팅 메시지를 전송합니다.
   * 1. STOMP를 통해 서버로 전송
   * 2. 로컬 채팅 목록에 추가 (즉시 UI 업데이트)
   *
   * 주의: WebRTC 시그널링이 아닌 STOMP로 메시지를 전송합니다.
   * 백엔드 TextChatController가 STOMP 메시지만 처리합니다.
   */
  const handleSendChat = useCallback(
    (text: string) => {
      // 1. STOMP를 통해 메시지 전송
      // 발행 경로: /pub/chat/message
      // 백엔드 컨트롤러의 @MessageMapping("/chat/message")가 수신
      textChatWebSocket.sendMessage({
        roomId: currentRoomId,
        sender: userName,
        message: text,
        type: "TALK",
        imageUrl: userImageUrl,
      });

      // 2. 로컬 UI에 즉시 반영
      // 서버 브로드캐스트를 기다리지 않고 바로 표시 (UX 향상)
      const timestamp = Date.now();
      setChatMessages((previousMessages) => [
        ...previousMessages,
        {
          id: generateId("message"),
          userId,
          userName,
          imageUrl: userImageUrl,
          message: text,
          timestamp,
          isMe: true,
        },
      ]);
    },
    [
      currentRoomId,
      userId,
      userName,
      userImageUrl,
      textChatWebSocket,
      setChatMessages,
    ],
  );

  return { handleJoin, handleLeave, handleSendChat };
}
