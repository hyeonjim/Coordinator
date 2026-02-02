import { useCallback, useEffect, useRef } from "react";
import type { UseParticipantManagementParams } from "@/types/room/types";

/**
 * 참여자 관리 및 실시간 동기화 훅
 * 참여자 추가/제거 및 WebRTC 상태와 동기화를 담당합니다.
 *
 * @param params - 훅 파라미터 (setParticipants, isJoined, userId, webRTC, userName, userImageUrl)
 * @returns 참여자 관리 함수들 (addParticipant, removeParticipant)
 */
export function useParticipantManagement({
  setParticipants,
  userId,
  userName,
  userImageUrl,
  webRTC,
  isJoined,
}: UseParticipantManagementParams) {
  // 최신 상태를 interval에서 참조하기 위한 ref들 (렌더링 루프 방지)
  const webRTCRef = useRef(webRTC);
  const infoRef = useRef({ userName, userImageUrl });

  useEffect(() => {
    webRTCRef.current = webRTC;
    infoRef.current = { userName, userImageUrl };
  }, [webRTC, userName, userImageUrl]);

  /**
   * 새로운 참여자를 목록에 추가하거나 기존 참여자 정보를 갱신합니다.
   */
  const addParticipant = useCallback(
    (id: string, name: string, imageUrl?: string) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.userId === id);
        if (exists) {
          // 이미 존재하면 정보 업데이트
          // 만약 전달받은 name이 ID와 같고, 기존에 이미 실명이 있었다면 업데이트하지 않음 (이름 퇴행 방지)
          const isNewNameTemporary = name === id;
          const isExistingNameBetter = exists.userName !== exists.userId;

          if (isNewNameTemporary && isExistingNameBetter) {
            console.log(`ℹ️ [Participant] 기등록된 실명 보유 중 - 업데이트 스킵: ${id}`);
            return prev;
          }

          if (exists.userName === name && exists.imageUrl === imageUrl) return prev;

          console.log(
            `📝 [Participant] 정보 업데이트: ${id} -> ${name} (img: ${
              imageUrl ? "yes" : "no"
            })`,
          );
          return prev.map((p) =>
            p.userId === id
              ? { ...p, userName: name, imageUrl: imageUrl ?? p.imageUrl }
              : p,
          );
        }
        // 새로 추가
        return [
          ...prev,
          {
            userId: id,
            userName: name,
            imageUrl,
            isSpeaking: false,
            micOn: true,
          },
        ];
      });
    },
    [setParticipants]
  );

  /**
   * 참여자를 목록에서 제거합니다.
   */
  const removeParticipant = useCallback(
    (id: string) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== id));
    },
    [setParticipants]
  );

  /**
   * 호스트(본인) 정보를 목록에 추가
   * 참여하기 버튼을 클릭한 후(isJoined === true)에만 목록에 표시합니다.
   */
  useEffect(() => {
    if (!userId || !isJoined) return;
    addParticipant(userId, userName, userImageUrl);
  }, [userId, userName, userImageUrl, addParticipant, isJoined]);

  /**
   * 참여자 상태 실시간 동기화
   * 100ms마다 참여자들의 음성 감지 및 마이크 상태를 업데이트합니다.
   * ref를 사용하여 webRTC identity 변화로 인한 불필요한 effect 재실행을 방지합니다.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (p.userId === userId) {
            // 호스트 상태 업데이트
            const currentMic = webRTCRef.current.isMicOn;
            const currentSpeaking = webRTCRef.current.isSpeaking;
            const { userName: currentName, userImageUrl: currentImg } = infoRef.current;

            if (
              p.micOn !== currentMic ||
              p.isSpeaking !== currentSpeaking ||
              p.userName !== currentName ||
              p.imageUrl !== currentImg
            ) {
              changed = true;
              return {
                ...p,
                userName: currentName,
                imageUrl: currentImg,
                micOn: currentMic,
                isSpeaking: currentSpeaking,
              };
            }
          } else {
            // 다른 참여자 상태 업데이트
            const speaking = webRTCRef.current.getPeerSpeaking(p.userId);
            if (p.isSpeaking !== speaking) {
              changed = true;
              return { ...p, isSpeaking: speaking };
            }
          }
          return p;
        });

        return changed ? next : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [userId, setParticipants]); // userId와 setParticipants만 의존성으로 가짐 (안정적)

  /**
   * 참여자의 마이크 상태를 업데이트합니다.
   */
  const updateParticipantMicStatus = useCallback(
    (id: string, micOn: boolean) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === id ? { ...p, micOn } : p))
      );
    },
    [setParticipants]
  );

  return { addParticipant, removeParticipant, updateParticipantMicStatus };
}
