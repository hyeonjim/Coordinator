import { useCallback, useEffect } from "react";
import type { UseParticipantManagementParams } from "@/types/room/types";

/**
 * 참여자 관리 및 실시간 동기화 훅
 * 참여자 추가/제거 및 WebRTC 상태와 동기화를 담당합니다.
 *
 * @param params - 훅 파라미터 (setParticipants, isJoined, userId, webRTC)
 * @returns 참여자 관리 함수들 (addParticipant, removeParticipant)
 */
export function useParticipantManagement({
  setParticipants,
  isJoined,
  userId,
  webRTC,
}: UseParticipantManagementParams) {
  /**
   * 새로운 참여자를 목록에 추가합니다.
   * 이미 존재하는 참여자는 추가하지 않습니다.
   */
  const addParticipant = useCallback(
    (id: string, name: string) => {
      setParticipants((previousParticipants) => {
        if (
          previousParticipants.some((participant) => participant.userId === id)
        )
          return previousParticipants;
        return [
          ...previousParticipants,
          { userId: id, userName: name, isSpeaking: false, micOn: true },
        ];
      });
    },
    [setParticipants],
  );

  /**
   * 참여자를 목록에서 제거합니다.
   */
  const removeParticipant = useCallback(
    (id: string) => {
      setParticipants((previousParticipants) =>
        previousParticipants.filter((participant) => participant.userId !== id),
      );
    },
    [setParticipants],
  );

  /**
   * 참여자 상태 실시간 동기화
   * 100ms마다 참여자들의 음성 감지 및 마이크 상태를 업데이트합니다.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((previousParticipants) =>
        previousParticipants.map((participant) => {
          if (participant.userId === userId) {
            // 내 상태 업데이트
            return {
              ...participant,
              isSpeaking: webRTC.isSpeaking,
              micOn: webRTC.isMicOn,
            };
          }
          // 다른 참여자 상태 업데이트
          return {
            ...participant,
            isSpeaking: webRTC.getPeerSpeaking(participant.userId),
          };
        }),
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isJoined, userId, webRTC, setParticipants]);

  return { addParticipant, removeParticipant };
}
