import { useParams, useNavigate } from "react-router-dom";

import CodeEditor from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import FileViewer from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

// 커스텀 훅
import { useTextChatWebSocket } from "./hooks/useTextChatWebSocket";
import { useVoiceChatWebSocket } from "./hooks/useVoiceChatWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import { useRoomSetup } from "./hooks/useRoomSetup";
import { useParticipantManagement } from "./hooks/useParticipantManagement";
import { useRoomActions } from "./hooks/useRoomActions";
import { useTextChatMessageHandler } from "./hooks/useTextChatMessageHandler";
import { useVoiceChatMessageHandler } from "./hooks/useVoiceChatMessageHandler";

// 연결 테스트용
import { createTestHelpers } from "./utils/testHelpers";
import { useState, useCallback } from "react";
import { getSocketBaseUrl } from "@/utils/socketUtils";

/**
 * Room 페이지 컴포넌트
 */
export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // 선택된 파일 상태
  const [selectedFile, setSelectedFile] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // 테스트 코드 상태
  const [generatedTestCode, setGeneratedTestCode] = useState<string | null>(
    null,
  );

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
    chatMessages,
    setChatMessages,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useRoomSetup(roomId);

  // WebSocket 연결 (2개의 독립적인 STOMP 연결)
  // 1. 텍스트 채팅 STOMP (localhost 백엔드 연결)
  const textChatWebSocket = useTextChatWebSocket(
    `${getSocketBaseUrl()}/ws-chat`,
  );
  // 3. VoiceChat STOMP (localhost 백엔드 연결)
  const voiceChatWebSocket = useVoiceChatWebSocket(
    `${getSocketBaseUrl()}/ws-voice`,
  );

  // WebRTC 연결
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

  const webRTC = useWebRTC(handleIceCandidate);

  // 참여자 관리 및 동기화
  const { addParticipant, removeParticipant, updateParticipantMicStatus } =
    useParticipantManagement({
      setParticipants,
      userId,
      userName,
      userImageUrl,
      webRTC,
      isJoined,
    });

  // 1. 텍스트 채팅 메시지 수신 처리 (STOMP)
  useTextChatMessageHandler({
    textChatWebSocket,
    currentRoomId,
    userName,
    isJoined,
    setChatMessages,
  });

  // 3. VoiceChat 메시지 처리 (STOMP - WebRTC signaling 포함)
  useVoiceChatMessageHandler({
    voiceChatWebSocket,
    webRTC,
    currentRoomId,
    userId,
    userName,
    isJoined,
    addParticipant,
    removeParticipant,
    updateParticipantMicStatus,
    userImageUrl,
  });

  // 방 액션 (입장/퇴장/채팅)
  const { handleJoin, handleLeave, handleSendChat } = useRoomActions({
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    webRTC,
    textChatWebSocket,
    voiceChatWebSocket,
    setIsJoined,
    setParticipants,
    setChatMessages,
    navigate,
  });

  // 테스트 헬퍼 (개발 환경만)
  const testHelpers = import.meta.env.DEV
    ? createTestHelpers({ addParticipant, setChatMessages, webRTC })
    : undefined;

  const handleToggleMic = useCallback(async () => {
    await webRTC.toggleMic();
    // 마이크 상태 변경을 다른 참여자에게 알림
    voiceChatWebSocket.sendMessage({
      type: "MIC",
      roomId: currentRoomId,
      senderId: userId,
      data: { microphoneOn: !webRTC.isMicOn },
    });
  }, [webRTC, voiceChatWebSocket, currentRoomId, userId]);

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
            <FileViewer
              roomId={Number(currentRoomId)}
              onFileSelect={(fileId, fileName) => {
                setSelectedFile({
                  id: fileId,
                  name: fileName,
                });
              }}
            />
          </div>

          {/* 음성 채팅 섹션 */}
          <div className="h-1/3 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <VoiceChat
                participants={participants}
                myUserId={userId}
                onToggleMic={handleToggleMic}
                onTogglePeerMute={webRTC.togglePeerMute}
                isPeerMuted={webRTC.isPeerMuted}
                testHelpers={testHelpers}
                isWebSocketConnected={voiceChatWebSocket.isConnected}
              />
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] overflow-hidden relative">
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedFile ? (
              <CodeEditor
                key={selectedFile.id}
                fileId={selectedFile.id}
                roomId={Number(currentRoomId)}
                fileName={selectedFile.name}
                onTestGenerated={setGeneratedTestCode}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#858585]">
                파일을 선택해주세요
              </div>
            )}
          </div>

          {/* 터미널에 테스트 코드 전달 */}
          <RoomTerminal testCode={generatedTestCode} />
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
