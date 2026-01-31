import { useEffect } from "react";
import type { UseWebSocketMessageHandlerParams } from "@/types/room/types";
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
}: UseWebSocketMessageHandlerParams) {
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
