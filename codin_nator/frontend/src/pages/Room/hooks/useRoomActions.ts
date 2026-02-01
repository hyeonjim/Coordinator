import { useCallback } from "react";
import type { UseRoomActionsParams } from "@/types/room/types";

/**
 * 방 입장/퇴장 훅
 * 방과 관련된 주요 액션들을 관리합니다.
 *
 * @param params - 훅 파라미터
 * @returns 방 액션 함수들 (handleJoin, handleLeave)
 */
export function useRoomActions({
  currentRoomId,
  webRTC,
  textChatStomp,
  voiceChatStomp,
  setIsJoined,
  setParticipants,
  navigate,
}: UseRoomActionsParams & {
  textChatStomp: any;
  voiceChatStomp: any;
}) {
  /**
   * 방에 입장합니다.
   * 1. 마이크 권한 요청 및 오디오 스트림 시작
   * 2. STOMP를 통해 입장 신호 전송
   */
  const handleJoin = useCallback(async () => {
    if (!currentRoomId) return;

    try {
      await webRTC.startAudio();
      
      // STOMP를 통해 입장 신호 전송
      voiceChatStomp.sendJoin();
      textChatStomp.sendEnter();
      
      setIsJoined(true);
    } catch (error) {
      console.error("입장 실패:", error);
      alert(
        "마이크 권한을 허용해주셔야 음성 채팅 서비스를 이용하실 수 있습니다.",
      );
    }
  }, [
    currentRoomId,
    webRTC,
    voiceChatStomp,
    textChatStomp,
    setIsJoined,
  ]);

  /**
   * 방에서 퇴장합니다.
   * 1. 퇴장 메시지 전송
   * 2. 오디오 스트림 정지
   * 3. 홈 화면으로 이동
   */
  const handleLeave = useCallback(() => {
    voiceChatStomp.sendLeave();
    webRTC.stopAudio();
    setIsJoined(false);
    setParticipants([]);
    navigate("/home", { replace: true });
  }, [
    voiceChatStomp,
    webRTC,
    setIsJoined,
    setParticipants,
    navigate,
  ]);

  return { handleJoin, handleLeave };
}
