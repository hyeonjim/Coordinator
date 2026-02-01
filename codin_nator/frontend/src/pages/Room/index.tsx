import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CodeEditor from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import FileViewer from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

// 커스텀 훅
import { useWebRTC } from "./hooks/useWebRTC";
import { useRoomSetup } from "./hooks/useRoomSetup";
import { useParticipantManagement } from "./hooks/useParticipantManagement";
import { useRoomActions } from "./hooks/useRoomActions";

// STOMP 훅
import { useTextChatStomp } from "@/hooks/chat/useTextChatStomp";
import { useVoiceChatStomp } from "@/hooks/chat/useVoiceChatStomp";

// 연결 테스트용
import { createTestHelpers } from "./utils/testHelpers";

/**
 * Room 페이지 컴포넌트
 */
export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // 방 초기 설정 및 상태 관리
  const {
    userId,
    userName,
    userImageUrl,
    currentRoomId,
    isJoined,
    setIsJoined,
    participants,
    setParticipants,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useRoomSetup(roomId);

  // STOMP 채팅 연결 (WebRTC보다 먼저 생성)
  const textChatStomp = useTextChatStomp(currentRoomId, userId, userName);
  const voiceChatStomp = useVoiceChatStomp(
    currentRoomId,
    userId,
    userName,
    userImageUrl,
  );

  // WebRTC 연결
  const webRTC = useWebRTC({
    onIceCandidate: voiceChatStomp.sendIce,
  });

  // 참여자 관리 및 동기화
  const { addParticipant, removeParticipant } = useParticipantManagement({
    setParticipants,
    userId,
    userName,
    userImageUrl,
    webRTC,
    isJoined,
  });

  // STOMP 시그널링 메시지 처리 등록
  useEffect(() => {
    if (!voiceChatStomp.isConnected) return;

    // JOIN 메시지 수신 (새 참여자 입장)
    voiceChatStomp.onJoin((peerId, userInfo) => {
      addParticipant(peerId, userInfo.userName, userInfo.imageUrl);
    });

    // PEER_LIST 메시지 수신 (기존 참여자 목록)
    voiceChatStomp.onPeerList(async (peerIds) => {
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
      const answer = await webRTC.handleOffer(peerId, sdp);
      if (answer) {
        voiceChatStomp.sendAnswer(peerId, answer);
      }
    });

    // ANSWER 메시지 수신
    voiceChatStomp.onAnswer(async (peerId, sdp) => {
      await webRTC.handleAnswer(peerId, sdp);
    });

    // ICE Candidate 수신
    voiceChatStomp.onIce(async (peerId, candidate) => {
      await webRTC.handleIce(peerId, candidate);
    });

    // LEAVE 메시지 수신 (참여자 퇴장)
    voiceChatStomp.onLeave((peerId) => {
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

  // 방 액션 (입장/퇴장/채팅)
  const { handleJoin, handleLeave } = useRoomActions({
    currentRoomId,
    webRTC,
    textChatStomp,
    voiceChatStomp,
    setIsJoined,
    setParticipants,
    navigate,
  });

  // 테스트 헬퍼 (개발 환경만)
  const testHelpers = import.meta.env.DEV
    ? createTestHelpers({ addParticipant, webRTC })
    : undefined;

  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <Header isJoined={isJoined} onJoin={handleJoin} onLeave={handleLeave} />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 패널 */}
        <aside className="w-64 flex flex-col">
          {/* 파일 탐색기 */}
          <div className="flex-1 overflow-auto">
            <FileViewer roomId={Number(currentRoomId)} />
          </div>

          {/* 음성 채팅 섹션 */}
          <div className="h-1/3 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <VoiceChat
                participants={participants}
                myUserId={userId}
                onToggleMic={webRTC.toggleMic}
                onTogglePeerMute={webRTC.togglePeerMute}
                isPeerMuted={webRTC.isPeerMuted}
                testHelpers={testHelpers}
                isWebSocketConnected={voiceChatStomp.isConnected}
              />
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] overflow-hidden relative">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditor />
          </div>
          <RoomTerminal />
        </main>

        <TextChat
          messages={textChatStomp.messages}
          onSendMessage={textChatStomp.sendMessage}
          disabled={!textChatStomp.isConnected}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>
    </div>
  );
}
