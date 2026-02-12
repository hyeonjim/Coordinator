import { useEffect, useRef } from "react";
import type {
  VoiceChatMessageReceived,
  UseVoiceChatMessageHandlerParams,
  UserPresenceData,
  OfferPayload,
  SessionDescriptionPayload,
  IceCandidatePayload,
  MicrophoneStatusPayload,
  ParticipantList,
} from "@/types/room/chat/voicechat/types";

/**
 * VoiceChat STOMP 메시지 수신 및 처리 훅
 * 백엔드 SignallingController에서 전송하는 메시지를 처리합니다:
 *
 * @param params - 훅 파라미터
 */
export function useVoiceChatMessageHandler({
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
}: UseVoiceChatMessageHandlerParams) {
  // 의존성들을 ref로 관리하여 useEffect 재실행 방지 (무한 루프 해결)
  const depsRef = useRef({
    voiceChatWebSocket,
    webRTC,
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    addParticipant,
    removeParticipant,
    updateParticipantMicStatus,
  });

  // 의존성 업데이트
  useEffect(() => {
    depsRef.current = {
      voiceChatWebSocket,
      webRTC,
      currentRoomId,
      userId,
      userName,
      userImageUrl,
      addParticipant,
      removeParticipant,
      updateParticipantMicStatus,
    };
  }, [
    voiceChatWebSocket,
    webRTC,
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    addParticipant,
    removeParticipant,
    updateParticipantMicStatus,
  ]);

  // JOIN 메시지 중복 전송 방지용 Ref
  const hasJoinedSentRef = useRef(false);

  useEffect(() => {
    // 퇴장하면 Ref 초기화
    if (!isJoined) {
      hasJoinedSentRef.current = false;
      return;
    }

    if (!currentRoomId) return;

    // STOMP 연결되지 않았으면 대기
    if (!voiceChatWebSocket.isConnected) return;

    /**
     * 메시지 처리 핸들러
     * (Ref를 사용하여 클로저 문제 해결 및 useEffect 의존성 제거)
     */
    const handleMessage = async (message: VoiceChatMessageReceived) => {
      const {
        voiceChatWebSocket,
        webRTC,
        currentRoomId,
        userId,
        userName,
        userImageUrl,
        addParticipant,
        removeParticipant,
        updateParticipantMicStatus,
      } = depsRef.current;

      switch (message.type) {
        case "JOIN": {
          /**
           * 새로운 참여자 입장
           * - 백엔드가 새 참여자 입장을 모든 사용자에게 알림
           * - 기존 참여자들은 새 참여자에게 OFFER를 전송해야 함
           */
          if (message.senderId === userId) break;

          const joinData = message.data as UserPresenceData;
          addParticipant(
            message.senderId,
            joinData.userName || message.senderId,
            joinData.imageUrl,
            joinData.micOn,
          );

          // 내 정보와 마이크 상태를 방 전체에 브로드캐스트 (기존 참여자들 정보 공유)
          voiceChatWebSocket.sendMessage({
            type: "IDENTITY",
            roomId: currentRoomId,
            senderId: userId,
            data: {
              userName,
              imageUrl: userImageUrl,
              micOn: webRTC.isMicOn,
            } satisfies UserPresenceData,
          });

          // 새 참여자에게 WebRTC Offer 전송
          const offer = await webRTC.createOffer(message.senderId);
          if (offer?.sdp) {
            voiceChatWebSocket.sendMessage({
              type: "OFFER",
              roomId: currentRoomId,
              senderId: userId,
              receiverId: message.senderId,
              data: {
                type: "offer",
                sdp: offer.sdp,
                userName,
                imageUrl: userImageUrl,
                micOn: webRTC.isMicOn,
              } satisfies OfferPayload,
            });
          }
          break;
        }

        case "IDENTITY": {
          /**
           * 다른 참여자의 신원 정보 수신
           * - PEER_LIST로 받은 참여자나, 내가 입장했을 때 기존 참여자들이 보낸 정보
           */
          const identityData = message.data as UserPresenceData;
          if (identityData.userName) {
            addParticipant(
              message.senderId,
              identityData.userName,
              identityData.imageUrl,
              identityData.micOn,
            );
          }
          break;
        }

        case "PEER_LIST": {
          /**
           * 현재 참여자 목록 수신
           * - 내가 방에 입장했을 때 백엔드가 전송
           * - data는 ParticipantList (참여자 userId 배열)
           */
          const peerList = message.data as ParticipantList;

          if (Array.isArray(peerList)) {
            for (const peerId of peerList) {
              if (peerId !== userId) {
                addParticipant(peerId, peerId);
              }
            }

            // 기존 참여자들에게 내 신원 정보와 마이크 상태 공유
            voiceChatWebSocket.sendMessage({
              type: "IDENTITY",
              roomId: currentRoomId,
              senderId: userId,
              data: {
                userName,
                imageUrl: userImageUrl,
                micOn: webRTC.isMicOn,
              } satisfies UserPresenceData,
            });
          }
          break;
        }

        case "OFFER": {
          /**
           * WebRTC Offer 수신
           * - 다른 참여자로부터 연결 요청 받음
           * - Answer를 생성하여 응답
           */
          if (message.receiverId !== userId && message.receiverId) break;

          const offerData = message.data as OfferPayload;

          // OFFER에서 상대방 정보를 추출하여 참여자 목록에 추가/갱신
          addParticipant(
            message.senderId,
            offerData.userName || message.senderId,
            offerData.imageUrl,
            offerData.micOn,
          );

          const offerSessionDescription: SessionDescriptionPayload = {
            type: offerData.type,
            sdp: offerData.sdp,
          };
          const answer = await webRTC.handleOffer(
            message.senderId,
            offerSessionDescription,
          );
          if (answer?.sdp) {
            voiceChatWebSocket.sendMessage({
              type: "ANSWER",
              roomId: currentRoomId,
              senderId: userId,
              receiverId: message.senderId,
              data: { type: "answer", sdp: answer.sdp } satisfies SessionDescriptionPayload,
            });
          }
          break;
        }

        case "ANSWER": {
          /**
           * WebRTC Answer 수신
           * - 내가 보낸 Offer에 대한 응답
           * - 연결 완료
           */
          if (message.receiverId !== userId && message.receiverId) break;

          const answerSessionDescription = message.data as SessionDescriptionPayload;
          await webRTC.handleAnswer(message.senderId, answerSessionDescription);
          break;
        }

        case "ICE": {
          /**
           * ICE Candidate 수신
           * - NAT 통과를 위한 네트워크 경로 정보
           */
          if (message.receiverId !== userId && message.receiverId) break;

          const iceCandidateData = message.data as IceCandidatePayload;
          await webRTC.handleIce(message.senderId, iceCandidateData);
          break;
        }

        case "MIC": {
          /**
           * 마이크 상태 변경
           * - 다른 참여자의 마이크 on/off 상태 업데이트
           */
          const micData = message.data as MicrophoneStatusPayload;
          updateParticipantMicStatus(message.senderId, micData.microphoneOn);
          break;
        }

        case "LEAVE":
          /**
           * 참여자 퇴장
           * - WebRTC 연결 정리
           * - 참여자 목록에서 제거
           */
          removeParticipant(message.senderId);
          webRTC.removePeer(message.senderId);
          break;

        default:
          // 알 수 없는 메시지 타입은 무시
          break;
      }
    };

    // 채팅방 구독 시작
    voiceChatWebSocket.subscribeToRoom(currentRoomId, handleMessage);

    // 방에 입장했음을 알림 (구독이 완료된 후 전송하여 무결성 보장)
    if (!hasJoinedSentRef.current) {
      const { userId, userName, userImageUrl, webRTC } = depsRef.current;
      voiceChatWebSocket.sendMessage({
        type: "JOIN",
        roomId: currentRoomId,
        senderId: userId,
        data: { userName, imageUrl: userImageUrl, micOn: webRTC.isMicOn } satisfies UserPresenceData,
      });
      hasJoinedSentRef.current = true;
    }

    /**
     * Cleanup 함수
     * - 컴포넌트 언마운트 또는 의존성 변경 시 구독 해제
     */
    return () => {
      voiceChatWebSocket.unsubscribeFromRoom();
    };
  }, [
    // 구독 관련 핵심 의존성만 포함 (자주 바뀌는 webRTC, user state 등은 제외)
    voiceChatWebSocket.isConnected,
    voiceChatWebSocket.subscribeToRoom,
    voiceChatWebSocket.unsubscribeFromRoom,
    currentRoomId,
    // isJoined가 바뀌면 재구독 필요
    isJoined,
    userId,
    voiceChatWebSocket,
  ]);
}
