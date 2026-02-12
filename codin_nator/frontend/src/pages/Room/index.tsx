import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";

import CodeEditor from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import FileViewer from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

import { useRoomSetup } from "../../hooks/room/chat/useRoomSetup";
import { useRoomActions } from "../../hooks/room/chat/useRoomActions";
import { useRoomChat } from "../../hooks/room/chat/useRoomChat";
import { useRoomVoice } from "../../hooks/room/chat/useRoomVoice";

import axiosInstance from "@/api/axios";

export default function RoomPage() {
  const [isLeftSidebarCollapsed] = useState(false);
  const [currentEditorCode, setCurrentEditorCode] = useState<string>("");
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // 선택된 파일 상태
  const [selectedFile, setSelectedFile] = useState<{
    id: number;
    name: string;
    content: string;
  } | null>(null);

  // 테스트 코드 상태
  const [, setGeneratedTestCode] = useState<string | null>(null);

  // 터미널 출력 상태
  const [, setTerminalText] = useState<string>("");
  const [terminalChunk, setTerminalChunk] = useState<string>("");

  /**
   * 터미널에 섹션별로 누적 출력
   */
  const appendTerminal = useCallback((title: string, text: string) => {
    const block = `===== ${title} =====\n${text}\n`;

    setTerminalText((prev) => {
      const base = prev.trimEnd();
      return base ? `${base}\n\n${block}` : block;
    });

    setTerminalChunk(block);
  }, []);

  // 방 초기 설정 및 상태 관리
  const roomSetup = useRoomSetup(roomId);
  const {
    userId,
    userName,
    userImageUrl,
    currentRoomId,
    isJoined,
    participants,
    chatMessages,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setChatMessages,
    setParticipants,
  } = roomSetup;

  /**
   * 방 참가자 DB 등록
   * isJoined=true가 된 순간 1회 호출
   */
  useEffect(() => {
    if (!isJoined || !currentRoomId) return;

    axiosInstance
      .post(`/v1/room/${currentRoomId}/participants/me`)
      .catch(() => {
        // 참가자 등록 실패 시 무시
      });
  }, [isJoined, currentRoomId]);

  // 텍스트 채팅 통합 훅
  const roomChat = useRoomChat({
    currentRoomId,
    userName,
    isJoined,
    setChatMessages,
  });

  // 음성 채팅 통합 훅
  const roomVoice = useRoomVoice({
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    isJoined,
    setParticipants,
  });
  const { isWebSocketConnected, handleToggleMic, togglePeerMute, isPeerMuted } =
    roomVoice;

  // 방 액션 (입장/퇴장/채팅 전송)
  const { handleJoin, handleLeave, handleSendChat } = useRoomActions({
    roomSetup,
    roomChat,
    roomVoice,
    navigate,
  });

  return (
    <div className="room-container">
      <Header
        isJoined={isJoined}
        onJoin={handleJoin}
        onLeave={handleLeave}
        selectedFileId={selectedFile?.id ?? null}
        editorContent={currentEditorCode}
      />

      <div className="room-main">
        <div className="relative self-stretch">
          <aside
            className="room-sidebar-left transition-all duration-300 overflow-hidden h-full"
            style={{ width: isLeftSidebarCollapsed ? 0 : undefined }}
          >
            <div className="flex-1 overflow-auto room-scrollbar">
              <FileViewer
                roomId={Number(currentRoomId)}
                onFileSelect={(fileId, content, fileName) => {
                  setSelectedFile({ id: fileId, content, name: fileName });
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
                  onTogglePeerMute={togglePeerMute}
                  isPeerMuted={isPeerMuted}
                  isWebSocketConnected={isWebSocketConnected}
                />
              </div>
            </div>
          </aside>
        </div>

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
                onAppendTerminal={appendTerminal}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#858585]">
                파일을 선택해주세요
              </div>
            )}
          </div>
          <RoomTerminal output={terminalChunk} />
        </main>

        <TextChat
          messages={chatMessages}
          onSendMessage={handleSendChat}
          disabled={!isJoined}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>
    </div>
  );
}
