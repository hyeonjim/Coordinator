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
  setIsJoined,
  setParticipants,
  setChatMessages,
  navigate,
}: UseRoomActionsParams) {
  /**
   * 방에 입장합니다.
   * 1. 마이크 권한 요청 및 오디오 스트림 시작
   * 2. WebSocket 연결
   * 3. 입장 메시지 전송
   */
  const handleJoin = useCallback(async () => {
    if (!currentRoomId) return;

    try {
      await webRTC.startAudio();
      webSocket.connect();

      setTimeout(() => {
        webSocket.send({
          type: "join",
          roomId: currentRoomId,
          userId,
          userName,
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
    setIsJoined,
  ]);

  /**
   * 방에서 퇴장합니다.
   * 1. 퇴장 메시지 전송
   * 2. 오디오 스트림 정지
   * 3. WebSocket 연결 종료
   * 4. 홈 화면으로 이동
   */
  const handleLeave = useCallback(() => {
    webSocket.send({ type: "leave", roomId: currentRoomId, userId });
    webRTC.stopAudio();
    webSocket.disconnect();
    setIsJoined(false);
    setParticipants([]);
    setChatMessages([]);
    navigate("/home", { replace: true });
  }, [
    currentRoomId,
    userId,
    webRTC,
    webSocket,
    setIsJoined,
    setParticipants,
    setChatMessages,
    navigate,
  ]);

  /**
   * 텍스트 채팅 메시지를 전송합니다.
   * 1. WebSocket을 통해 서버로 전송
   * 2. 로컬 채팅 목록에 추가 (즉시 UI 업데이트)
   */
  const handleSendChat = useCallback(
    (text: string) => {
      const timestamp = Date.now();
      webSocket.send({
        type: "chat",
        roomId: currentRoomId,
        userId,
        userName,
        imageUrl: userImageUrl,
        message: text,
        timestamp,
      });
      setChatMessages((previousMessages) => [
        ...previousMessages,
        {
          id: generateId("message"),
          userId,
          userName,
          message: text,
          timestamp,
          isMe: true,
        },
      ]);
    },
    [currentRoomId, userId, userName, userImageUrl, webSocket, setChatMessages],
  );

  return { handleJoin, handleLeave, handleSendChat };
}
