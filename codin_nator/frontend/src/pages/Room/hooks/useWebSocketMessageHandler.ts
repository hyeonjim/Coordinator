import { useEffect } from "react";
import type { UseWebSocketMessageHandlerParams } from "@/types/room/types";
import type { UseVoiceChatStompReturn } from "@/types/chat/voicetypes";
import { generateId } from "@/utils/room/idGenerator";

/**
 * WebSocket 메시지 수신 및 처리 훅
 * WebSocket으로 받은 메시지를 타입별로 처리합니다.
 *
 * @param params - 훅 파라미터
 */
export function useWebSocketMessageHandler({
  webSocket,
  webRTC,
  userId,
  currentRoomId,
  addParticipant,
  removeParticipant,
  setChatMessages,
  setIsJoined,
  voiceChatStomp,
}: UseWebSocketMessageHandlerParams & {
  voiceChatStomp: UseVoiceChatStompReturn;
}) {
  // STOMP 음성 채팅 시그널링 콜백 등록
  useEffect(() => {
    console.log("[WebSocketMessageHandler] 🔗 STOMP 시그널링 콜백 등록");

    // JOIN 메시지 수신 (새 참여자 입장)
    voiceChatStomp.onJoin((peerId, userInfo) => {
      console.log(
        `[WebSocketMessageHandler] 👤 새 참여자 입장: ${userInfo.userName}`,
      );
      addParticipant(peerId, userInfo.userName, userInfo.imageUrl);
    });

    // PEER_LIST 메시지 수신 (기존 참여자 목록)
    voiceChatStomp.onPeerList(async (peerIds) => {
      console.log(
        `[WebSocketMessageHandler] 📋 기존 참여자 목록 수신: ${peerIds.length}명`,
      );
      setIsJoined(true);

      // 각 피어에게 Offer 전송
      for (const peerId of peerIds) {
        if (peerId !== userId) {
          const offer = await webRTC.createOffer(peerId);
          if (offer) {
            voiceChatStomp.sendOffer(peerId, offer);
          }
        }
      }
    });

    // OFFER 메시지 수신
    voiceChatStomp.onOffer(async (peerId, sdp) => {
      console.log(`[WebSocketMessageHandler] 📞 OFFER 수신: ${peerId}`);
      const answer = await webRTC.handleOffer(peerId, sdp);
      if (answer) {
        voiceChatStomp.sendAnswer(peerId, answer);
      }
    });

    // ANSWER 메시지 수신
    voiceChatStomp.onAnswer(async (peerId, sdp) => {
      console.log(`[WebSocketMessageHandler] 📞 ANSWER 수신: ${peerId}`);
      await webRTC.handleAnswer(peerId, sdp);
    });

    // ICE Candidate 수신
    voiceChatStomp.onIce(async (peerId, candidate) => {
      console.log(`[WebSocketMessageHandler] 🧊 ICE 수신: ${peerId}`);
      await webRTC.handleIce(peerId, candidate);
    });

    // LEAVE 메시지 수신 (참여자 퇴장)
    voiceChatStomp.onLeave((peerId) => {
      console.log(`[WebSocketMessageHandler] 👋 참여자 퇴장: ${peerId}`);
      removeParticipant(peerId);
      webRTC.removePeer(peerId);
    });
  }, [
    voiceChatStomp,
    webRTC,
    userId,
    addParticipant,
    removeParticipant,
    setIsJoined,
  ]);

  useEffect(() => {
    const message = webSocket.lastMessage;
    if (!message) return;

    const handleMessage = async () => {
      switch (message.type) {
        case "joined":
          // 방 입장 성공: 기존 참여자들과 WebRTC 연결 시작
          setIsJoined(true);
          for (const peer of message.peers) {
            if (peer.userId !== userId) {
              addParticipant(peer.userId, peer.userName, peer.imageUrl);
              const offer = await webRTC.createOffer(peer.userId);
              if (offer)
                webSocket.send({
                  type: "offer",
                  roomId: currentRoomId,
                  from: userId,
                  to: peer.userId,
                  sdp: offer,
                });
            }
          }
          break;

        case "peer-joined":
          // 새로운 참여자 입장 알림
          if (message.userId !== userId)
            addParticipant(message.userId, message.userName, message.imageUrl);
          break;

        case "offer":
          // WebRTC Offer 수신: Answer 생성 및 전송
          if (message.to === userId) {
            const answer = await webRTC.handleOffer(message.from, message.sdp);
            if (answer)
              webSocket.send({
                type: "answer",
                roomId: currentRoomId,
                from: userId,
                to: message.from,
                sdp: answer,
              });
          }
          break;

        case "answer":
          // WebRTC Answer 수신: 연결 완료
          if (message.to === userId)
            await webRTC.handleAnswer(message.from, message.sdp);
          break;

        case "ice":
          // ICE Candidate 수신: NAT 통과를 위한 네트워크 경로 정보
          if (message.to === userId)
            await webRTC.handleIce(message.from, message.candidate);
          break;

        case "peer-left":
          // 참여자 퇴장 알림
          removeParticipant(message.userId);
          webRTC.removePeer(message.userId);
          break;

        case "chat":
          // 텍스트 채팅 메시지 수신
          setChatMessages((previousMessages) => [
            ...previousMessages,
            {
              id: generateId("message"),
              userId: message.userId,
              userName: message.userName,
              imageUrl: message.imageUrl,
              message: message.message,
              timestamp: message.timestamp,
              isMe: message.userId === userId,
            },
          ]);
          break;
      }
    };

    handleMessage();
  }, [
    webSocket.lastMessage,
    userId,
    currentRoomId,
    addParticipant,
    removeParticipant,
    webRTC,
    webSocket,
    setChatMessages,
    setIsJoined,
  ]);
}
