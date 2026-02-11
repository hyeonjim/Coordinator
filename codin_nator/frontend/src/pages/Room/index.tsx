import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";

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
import { getSocketBaseUrl } from "@/utils/socketUtils";
import axiosInstance from "@/api/axios";

export default function RoomPage() {
  const [isLightMode, setIsLightMode] = useState(false);
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
  const [, setGeneratedTestCode] = useState<string | null>(null);

  // ✅ 누적 저장용(원하는 형태 그대로 유지)
  const [, setTerminalText] = useState<string>("");

  // ✅ xterm에 "이번에 추가할 chunk
  // "만 내려주기 위한 상태
  const [terminalChunk, setTerminalChunk] = useState<string>("");

  /**
   * ✅ 터미널에 섹션별로 누적 출력
   * - terminalText: 전체 누적(저장/분석용)
   * - terminalChunk: 이번에 추가된 block만 (xterm 중복 출력 방지)
   */
  const appendTerminal = useCallback((title: string, text: string) => {
    const block = `===== ${title} =====\n${text}\n`;

    setTerminalText((prev) => {
      const base = prev.trimEnd();
      return base ? `${base}\n\n${block}` : block;
    });

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

  /**
   * ✅ 방 참가자(Participant) DB 등록
   * - 같은 방에서 생성된 AI 리포트를 "참가자"가 마이페이지에서 볼 수 있게 하려면
   *   내가 이 방에 참여했다는 기록이 필요함.
   * - isJoined=true가 된 순간 1회(멱등) 호출
   */
  useEffect(() => {
    if (!isJoined) return;
    if (!currentRoomId) return;

    axiosInstance
      .post(`/v1/room/${currentRoomId}/participants/me`)
      .catch((e) => {
        console.error("[RoomPage] participant join failed", e);
      });
  }, [isJoined, currentRoomId]);

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

  // 마이크 토글
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
    <div className={`room-container${isLightMode ? " room-light" : ""}`}>
      <Header
        isJoined={isJoined}
        onJoin={handleJoin}
        onLeave={handleLeave}
        selectedFileId={selectedFile?.id ?? null}
        editorContent={currentEditorCode}
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode((v) => !v)}
      />

      <div className="room-main">
        <aside className="room-sidebar-left">
          <div className="flex-1 overflow-auto room-scrollbar">
            {/* 사용자 정보 전달하여 실시간 위치 추적 */}
            <FileViewer
              roomId={Number(currentRoomId)}
              onFileSelect={(fileId, content, fileName) => {
                setSelectedFile({ id: fileId, content, name: fileName });
                // 필요하면 여기서 terminalText 초기화도 가능
                setTerminalText("");
              }}
              userId={userId}
              userName={userName}
              userImageUrl={userImageUrl}
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
                isWebSocketConnected={voiceChatWebSocket.isConnected}
              />
            </div>
          </div>
        </aside>

        <main className="room-content">
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedFile ? (
              <CodeEditor
                key={selectedFile.id}
                fileId={selectedFile.id}
                roomId={Number(currentRoomId)}
                fileContent={selectedFile.content}
                fileName={selectedFile.name}
                onChange={setCurrentEditorCode}
                onTestGenerated={(code) => setGeneratedTestCode(code)}
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
