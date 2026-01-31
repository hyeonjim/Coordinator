import { useParams, useNavigate } from "react-router-dom";

import CodeEditor from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import FileViewer from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

// 커스텀 훅
import { useWebSocket } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import { useRoomSetup } from "./hooks/useRoomSetup";
import { useParticipantManagement } from "./hooks/useParticipantManagement";
import { useRoomActions } from "./hooks/useRoomActions";
import { useWebSocketMessageHandler } from "./hooks/useWebSocketMessageHandler";

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
    webSocketUrl,
    currentRoomId,
    isJoined,
    setIsJoined,
    participants,
    setParticipants,
    chatMessages,
    setChatMessages,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useRoomSetup(roomId);

  // WebSocket 및 WebRTC 연결
  const webSocket = useWebSocket(webSocketUrl);
  const webRTC = useWebRTC();

  // 참여자 관리 및 동기화
  const { addParticipant, removeParticipant } = useParticipantManagement({
    setParticipants,
    isJoined,
    userId,
    webRTC,
  });

  // WebSocket 메시지 처리
  useWebSocketMessageHandler({
    webSocket,
    webRTC,
    userId,
    currentRoomId,
    addParticipant,
    removeParticipant,
    setChatMessages,
    setIsJoined,
  });

  // 방 액션 (입장/퇴장/채팅)
  const { handleJoin, handleLeave, handleSendChat } = useRoomActions({
    currentRoomId,
    userId,
    userName,
    webRTC,
    webSocket,
    addParticipant,
    setIsJoined,
    setParticipants,
    setChatMessages,
    navigate,
  });

  // 테스트 헬퍼 (개발 환경만)
  const testHelpers = import.meta.env.DEV
    ? createTestHelpers({ addParticipant, setChatMessages, webRTC })
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
            <div className="p-2 flex-1 overflow-hidden">
              <VoiceChat
                participants={participants}
                myUserId={userId}
                onToggleMic={webRTC.toggleMic}
                onTogglePeerMute={webRTC.togglePeerMute}
                isPeerMuted={webRTC.isPeerMuted}
                testHelpers={testHelpers}
                isWebSocketConnected={webSocket.isConnected}
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
          messages={chatMessages}
          onSendMessage={handleSendChat}
          disabled={!isJoined}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>
    </div>
  );
}
