/**
 * useRoomVoice.ts - 음성 채팅 통합 훅
 *
 * [이 훅의 역할]
 * 음성 채팅에 필요한 모든 하위 훅을 조합합니다:
 * 1. useVoiceChatWebSocket: STOMP WebSocket (WebRTC 시그널링 채널)
 * 2. useWebRTC: P2P 오디오 연결 관리
 * 3. useVoiceChatMessageHandler: 시그널링 메시지 처리
 * + 참여자 목록 관리 및 실시간 상태 동기화
 *
 * [음성 채팅 전체 아키텍처]
 * ┌──────────────────────────────────────────────────┐
 * │ useRoomVoice (이 훅 - 통합 관리)                   │
 * │   ├─ useVoiceChatWebSocket (STOMP 시그널링)        │
 * │   ├─ useWebRTC (P2P 오디오)                        │
 * │   ├─ useVoiceChatMessageHandler (메시지 처리)      │
 * │   └─ 참여자 관리 (addParticipant, removeParticipant)│
 * └──────────────────────────────────────────────────┘
 *
 * [참여자 상태 동기화]
 * - 100ms 간격의 setInterval로 참여자들의 음성 감지/마이크 상태를 갱신
 * - ref를 사용하여 interval 재등록 없이 최신 webRTC 상태를 참조
 *
 * @param params - 훅 파라미터
 * @returns 음성 채팅 관련 상태 및 함수들
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useVoiceChatWebSocket } from "./useVoiceChatWebSocket";
import { useWebRTC } from "./useWebRTC";
import { useVoiceChatMessageHandler } from "./useVoiceChatMessageHandler";
import type {
  UseRoomVoiceParams,
  UseRoomVoiceReturn,
} from "@/types/voice";
import { getSocketBaseUrl } from "@/utils/socketUtils";
export function useRoomVoice({
  currentRoomId,
  userId,
  userName,
  userImageUrl,
  isJoined,
  setParticipants,
}: UseRoomVoiceParams): UseRoomVoiceReturn {
  // 음성 채팅 STOMP WebSocket 연결
  const voiceChatWebSocket = useVoiceChatWebSocket(
    `${getSocketBaseUrl()}/ws-voice`,
  );

  // ICE Candidate 콜백
  const handleIceCandidate = useCallback(
    (peerId: string, candidate: RTCIceCandidate) => {
      voiceChatWebSocket.sendMessage({
        type: "ICE",
        roomId: currentRoomId,
        senderId: userId,
        receiverId: peerId,
        data: candidate,
      });
    },
    [voiceChatWebSocket, currentRoomId, userId],
  );

  // WebRTC 연결 관리
  const webRTC = useWebRTC(handleIceCandidate);

  // ─── 참여자 관리 ────────────────────────────────────────────────────────────

  /**
   * 최신 webRTC 인스턴스와 사용자 정보를 interval에서 참조하기 위한 ref
   * (ref를 통해 interval 재등록 없이 최신 값을 읽을 수 있습니다)
   */
  const webRTCRef = useRef(webRTC);
  const userInfoRef = useRef({ userName, userImageUrl });

  useEffect(() => {
    webRTCRef.current = webRTC;
    userInfoRef.current = { userName, userImageUrl };
  }, [webRTC, userName, userImageUrl]);

  /**
   * 새로운 참여자를 목록에 추가하거나 기존 참여자 정보를 갱신합니다.
   */
  const addParticipant = useCallback(
    (id: string, name: string, imageUrl?: string, micOn?: boolean) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.userId === id);
        if (exists) {
          // 이름 퇴행 방지: 전달받은 name이 ID와 같고 기존에 실명이 있으면 이름은 유지하지만 micOn은 갱신 가능
          const isNewNameTemporary = name === id;
          const isExistingNameBetter = exists.userName !== exists.userId;

          if (isNewNameTemporary && isExistingNameBetter) {
            if (micOn !== undefined && exists.micOn !== micOn) {
              return prev.map((p) => (p.userId === id ? { ...p, micOn } : p));
            }
            return prev;
          }

          if (
            exists.userName === name &&
            exists.imageUrl === imageUrl &&
            (micOn === undefined || exists.micOn === micOn)
          )
            return prev;

          return prev.map((p) =>
            p.userId === id
              ? {
                  ...p,
                  userName: name,
                  imageUrl: imageUrl ?? p.imageUrl,
                  micOn: micOn ?? p.micOn,
                }
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
            micOn: micOn ?? true,
          },
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
      setParticipants((prev) => prev.filter((p) => p.userId !== id));
    },
    [setParticipants],
  );

  /**
   * 참여자의 마이크 상태를 업데이트합니다.
   */
  const updateParticipantMicStatus = useCallback(
    (id: string, micOn: boolean) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === id ? { ...p, micOn } : p)),
      );
    },
    [setParticipants],
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
            const { userName: currentName, userImageUrl: currentImg } =
              userInfoRef.current;

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

  // ────────────────────────────────────────────────────────────────────────────

  // VoiceChat 메시지 처리
  useVoiceChatMessageHandler({
    voiceChatWebSocket,
    webRTC,
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    isJoined,
    addParticipant,
    removeParticipant,
    updateParticipantMicStatus,
  });

  // 마이크 토글 핸들러
  const handleToggleMic = useCallback(async () => {
    webRTC.toggleMic();
    voiceChatWebSocket.sendMessage({
      type: "MIC",
      roomId: currentRoomId,
      senderId: userId,
      data: { microphoneOn: !webRTC.isMicOn },
    });
  }, [webRTC, voiceChatWebSocket, currentRoomId, userId]);

  return useMemo(
    () => ({
      isWebSocketConnected: voiceChatWebSocket.isConnected,
      isMicOn: webRTC.isMicOn,
      handleToggleMic,
      togglePeerMute: webRTC.togglePeerMute,
      isPeerMuted: webRTC.isPeerMuted,
      webRTC,
      voiceChatWebSocket,
    }),
    [
      voiceChatWebSocket,
      webRTC,
      handleToggleMic,
    ],
  );
}
