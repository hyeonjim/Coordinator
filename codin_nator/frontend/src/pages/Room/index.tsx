import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";

import CodeEditor from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import FileViewer from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

// 커스텀 훅 (✅ master 로직 유지)
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
import { getSocketBaseUrl } from "@/utils/socketUtils";

export default function RoomPage() {
  const [currentEditorCode, setCurrentEditorCode] = useState<string>("");
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // ✅ 선택된 파일 상태 (content 포함)
  const [selectedFile, setSelectedFile] = useState<{
    id: number;
    name: string;
    content: string;
  } | null>(null);

  // (기존 유지) 테스트 코드 상태 (나중에 저장/AI분석 등에 쓸 수 있음)
  // const [generatedTestCode, setGeneratedTestCode] = useState<string | null>(
  //   null,
  // );

  // ✅ 누적 저장용(원하는 형태 그대로 유지)
  // const [terminalText, setTerminalText] = useState<string>("");

  // ✅ xterm에 "이번에 추가할 chunk"만 내려주기 위한 상태
  const [terminalChunk, setTerminalChunk] = useState<string>("");

  /**
   * ✅ 터미널에 섹션별로 누적 출력
   * - terminalText: 전체 누적(저장/분석용)
   * - terminalChunk: 이번에 추가된 block만 (xterm 중복 출력 방지)
   */
  const appendTerminal = useCallback((title: string, text: string) => {
    const block = `===== ${title} =====\n${text}\n`;

    // setTerminalText((prev) => {
    //   const base = prev.trimEnd();
    //   return base ? `${base}\n\n${block}` : block;
    // });

    // ✅ xterm에는 새로 추가된 block만 흘려보냄
    setTerminalChunk(block);
  }, []);

  // 방 초기 설정 및 상태 관리 (✅ master 유지)
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

  // WebSocket 연결 (✅ master 유지: STOMP 2개)
  const textChatWebSocket = useTextChatWebSocket(
    `${getSocketBaseUrl()}/ws-chat`,
  );
  const voiceChatWebSocket = useVoiceChatWebSocket(
    `${getSocketBaseUrl()}/ws-voice`,
  );

  // WebRTC 연결 (✅ master 유지)
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

  // 참여자 관리 및 동기화 (✅ master 유지)
  const { addParticipant, removeParticipant, updateParticipantMicStatus } =
    useParticipantManagement({
      setParticipants,
      userId,
      userName,
      userImageUrl,
      webRTC,
      isJoined,
    });

  // 텍스트 채팅 메시지 수신 처리 (✅ master 유지)
  useTextChatMessageHandler({
    textChatWebSocket,
    currentRoomId,
    userName,
    isJoined,
    setChatMessages,
  });

  // VoiceChat 메시지 처리 (✅ master 유지)
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

  // 방 액션 (✅ master 유지)
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

  // 마이크 토글 (✅ master 유지)
  const handleToggleMic = useCallback(async () => {
    await webRTC.toggleMic();
    voiceChatWebSocket.sendMessage({
      type: "MIC",
      roomId: currentRoomId,
      senderId: userId,
      data: { microphoneOn: !webRTC.isMicOn },
    });
  }, [webRTC, voiceChatWebSocket, currentRoomId, userId]);

  return (
    <div className="h-screen flex flex-col">
      <Header
        isJoined={isJoined}
        onJoin={handleJoin}
        onLeave={handleLeave}
        selectedFileId={selectedFile?.id ?? null}
        editorContent={currentEditorCode}
      />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 flex flex-col">
          <div className="flex-1 overflow-auto">
            {/* ✅ 중요: 3인자 콜백으로 전달해야 FileViewer가 content를 fetch해서 준다 */}
            <FileViewer
              roomId={Number(currentRoomId)}
              onFileSelect={(fileId, content, fileName) => {
                setSelectedFile({ id: fileId, content, name: fileName });
                // 필요하면 여기서 terminalText 초기화도 가능
                // setTerminalText("");
              }}
            />
          </div>

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
                fileContent={selectedFile.content}
                fileName={selectedFile.name}
                onChange={setCurrentEditorCode}
                // onTestGenerated={setGeneratedTestCode} // ✅ 기존 유지
                onAppendTerminal={appendTerminal} // ✅ 네 기능
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#858585]">
                파일을 선택해주세요
              </div>
            )}
          </div>

          {/* ✅ xterm에는 "새로 추가된 chunk"만 내려보내서 중복 출력 방지 */}
          <RoomTerminal output={terminalChunk} />
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
