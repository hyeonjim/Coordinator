import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FileViewer from "../../components/room/file-viewer";
import RoomTerminal from "../../components/room/room-terminal";
import CodeEditor from "../../components/room/code-editor";

import { useWebSocket } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";

import { VoiceChat } from "../../components/room/chat/VoiceChat";
import { TextChat } from "../../components/room/chat/TextChat";
import Header from "../../components/room/Header";

import type { ChatMessage, Participant } from "../../types/chat/types";
import type { TabType } from "../../types/room/types";

/**
 * 랜덤 ID 생성 유틸리티 함수
 * @param prefix - ID 접두사 (기본값: "id")
 * @returns 생성된 랜덤 ID
 */
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // ============================================================================
  // 사용자 정보 및 WebSocket/WebRTC 초기화
  // ============================================================================
  const userId = useMemo(() => generateId("user"), []);
  const userName = useMemo(() => `사용자_${userId.slice(-4)}`, [userId]);
  const webSocketUrl = useMemo(
    () => (import.meta.env.VITE_SIGNALING_URL as string) || "",
    [],
  );
  const currentRoomId = roomId ?? "";

  // ============================================================================
  // 방 상태 관리
  // ============================================================================
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // ============================================================================
  // UI 상태 관리
  // ============================================================================
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ============================================================================
  // WebSocket 및 WebRTC 연결
  // ============================================================================
  const webSocket = useWebSocket(webSocketUrl);
  const webRTC = useWebRTC();

  // ============================================================================
  // 참여자 관리 함수
  // ============================================================================

  /**
   * 새로운 참여자를 목록에 추가합니다.
   * 이미 존재하는 참여자는 추가하지 않습니다.
   */
  const addParticipant = useCallback((id: string, name: string) => {
    setParticipants((previousParticipants) => {
      if (previousParticipants.some((participant) => participant.userId === id))
        return previousParticipants;
      return [
        ...previousParticipants,
        { userId: id, userName: name, isSpeaking: false, micOn: true },
      ];
    });
  }, []);

  /**
   * 참여자를 목록에서 제거합니다.
   */
  const removeParticipant = useCallback((id: string) => {
    setParticipants((previousParticipants) =>
      previousParticipants.filter((participant) => participant.userId !== id),
    );
  }, []);

  // ============================================================================
  // WebSocket 메시지 수신 처리
  // ============================================================================
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
              addParticipant(peer.userId, peer.userName);
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
            addParticipant(message.userId, message.userName);
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
              id: generateId("msg"),
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
  ]);

  // ============================================================================
  // 방 입장/퇴장 핸들러
  // ============================================================================

  /**
   * 방에 입장합니다.
   * 1. 마이크 권한 요청 및 오디오 스트림 시작
   * 2. WebSocket 연결
   * 3. 입장 메시지 전송
   */
  const handleJoin = useCallback(async () => {
    if (!currentRoomId) return;
    try {
      await webRTC.startAudio();
      webSocket.connect();
      setTimeout(() => {
        webSocket.send({
          type: "join",
          roomId: currentRoomId,
          userId,
          userName,
        });
        addParticipant(userId, userName);
      }, 300);
    } catch (error) {
      console.error("입장 실패:", error);
      alert(
        "마이크 권한을 허용해주셔야 음성 채팅 서비스를 이용하실 수 있습니다.",
      );
    }
  }, [currentRoomId, userId, userName, webRTC, webSocket, addParticipant]);

  const handleJoinAction = useCallback(async () => {
    await handleJoin();
    setIsJoined(true);
  }, [handleJoin]);

  /**
   * 방에서 퇴장합니다.
   * 1. 퇴장 메시지 전송
   * 2. 오디오 스트림 정지
   * 3. WebSocket 연결 종료
   * 4. 홈 화면으로 이동
   */
  const handleLeave = () => {
    webSocket.send({ type: "leave", roomId: currentRoomId, userId });
    webRTC.stopAudio();
    webSocket.disconnect();
    setIsJoined(false);
    setParticipants([]);
    setChatMessages([]);
    navigate("/home", { replace: true });
  };

  // ============================================================================
  // 채팅 전송 핸들러
  // ============================================================================

  /**
   * 텍스트 채팅 메시지를 전송합니다.
   * 1. WebSocket을 통해 서버로 전송
   * 2. 로컬 채팅 목록에 추가 (즉시 UI 업데이트)
   */
  const handleSendChat = (text: string) => {
    const timestamp = Date.now();
    webSocket.send({
      type: "chat",
      roomId: currentRoomId,
      userId,
      userName,
      message: text,
      timestamp,
    });
    setChatMessages((previousMessages) => [
      ...previousMessages,
      {
        id: generateId("msg"),
        userId,
        userName,
        message: text,
        timestamp,
        isMe: true,
      },
    ]);
  };

  // ============================================================================
  // 참여자 상태 동기화 (음성 감지, 마이크 상태)
  // ============================================================================

  /**
   * 100ms마다 참여자들의 음성 감지 및 마이크 상태를 업데이트합니다.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((previousParticipants) =>
        previousParticipants.map((participant) => {
          if (participant.userId === userId) {
            // 내 상태 업데이트
            return {
              ...participant,
              isSpeaking: webRTC.isSpeaking,
              micOn: webRTC.isMicOn,
            };
          }
          // 다른 참여자 상태 업데이트
          return {
            ...participant,
            isSpeaking: webRTC.getPeerSpeaking(participant.userId),
          };
        }),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isJoined, userId, webRTC]);

  // ============================================================================
  // 테스트용 코드 (개발 환경에서만 표시)
  // ============================================================================
  const TEST_USER_ID = "test_user_001";
  const TEST_USER_NAME = "테스트 유저";

  const simulateTestUserJoin = () => {
    addParticipant(TEST_USER_ID, TEST_USER_NAME);
  };

  const simulateTestUserMessage = () => {
    const messages = [
      "안녕하세요! 👋",
      "잘 들리시나요?",
      "리액트 공부 화이팅!",
      "테스트 메시지입니다.",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setChatMessages((previousMessages) => [
      ...previousMessages,
      {
        id: generateId("msg"),
        userId: TEST_USER_ID,
        userName: TEST_USER_NAME,
        message: randomMessage,
        timestamp: Date.now(),
        isMe: false,
      },
    ]);
  };

  // ============================================================================
  // 렌더링
  // ============================================================================
  return (
    <div className="h-screen flex flex-col">
      {/* ========================================================================
          상단 헤더
          - 방 입장/퇴장 버튼
          ======================================================================== */}
      <Header
        isJoined={isJoined}
        onJoin={handleJoinAction}
        onLeave={handleLeave}
      />

      {/* ========================================================================
          메인 컨텐츠 영역 (3단 레이아웃)
          - 왼쪽: 파일 탐색기 + 음성 채팅
          - 중앙: 코드 에디터 + 터미널
          - 오른쪽: AI/채팅 탭
          ======================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ====================================================================
            왼쪽 사이드바: 파일 탐색기 + 음성 채팅
            ==================================================================== */}
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
              />
            </div>

            {/* 테스트 도구 - 개발 중에만 사용 */}
            {import.meta.env.DEV && (
              <div className="p-2 bg-slate-100 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 mb-1">
                  🛠️ DEBUG
                </p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={simulateTestUserJoin}
                    className="px-1.5 py-0.5 bg-slate-600 text-white text-[10px] rounded hover:bg-slate-700"
                  >
                    유저+
                  </button>
                  <button
                    onClick={simulateTestUserMessage}
                    className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700"
                  >
                    채팅+
                  </button>
                  <button
                    onClick={() => webRTC.simulateIncomingAudio(TEST_USER_ID)}
                    className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded hover:bg-rose-700"
                  >
                    상대방 음성확인
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${webSocket.isConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-[10px] text-slate-500">
                    {webSocket.isConnected ? "WS Connected" : "WS Disconnected"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ====================================================================
            중앙 메인 영역: 코드 에디터 + 터미널
            ==================================================================== */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] overflow-hidden relative">
          {/* 코드 에디터 */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditor />
          </div>

          {/* 터미널 (모든 기능과 데이터를 내부에서 관리) */}
          <RoomTerminal />
        </main>

        {/* ====================================================================
            오른쪽 사이드바: AI / 채팅 탭
            ==================================================================== */}
        <div className="relative h-full flex">
          {/* 사이드바 컨텐츠 */}
          <div
            className={`
              h-full
              transition-all
              duration-300
              ease-in-out
              overflow-hidden
              ${isSidebarCollapsed ? "w-0" : "w-80"}
            `}
          >
            <aside className="h-full w-80 border-l border-slate-200 bg-white flex flex-col">
              {/* 탭 헤더 */}
              <div className="h-10 flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 text-sm font-medium transition-colors ${
                    activeTab === "ai"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/20"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  AI 기능
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 text-sm font-medium transition-colors ${
                    activeTab === "chat"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/20"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  채팅방
                </button>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {activeTab === "ai" ? (
                  /* AI 어시스턴트 탭 */
                  <div className="absolute inset-0 p-4 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                      <span className="text-3xl">✨</span>
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">
                      AI Assistant
                    </h3>
                    <p className="text-slate-500 text-sm">
                      안녕하세요! 코드에 대해 질문하거나,
                      <br />
                      테스트 코드 생성을 요청해주세요.
                    </p>
                  </div>
                ) : (
                  /* 텍스트 채팅 탭 */
                  <div className="absolute inset-0 flex flex-col">
                    <TextChat
                      messages={chatMessages}
                      onSendMessage={handleSendChat}
                      disabled={!isJoined}
                    />
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* 사이드바 토글 버튼 */}
          <button
            onClick={() => setIsSidebarCollapsed((previous) => !previous)}
            className="
              absolute
              -left-6
              top-1/2
              -translate-y-1/2
              bg-neutral-700
              hover:bg-neutral-600
              px-1
              py-2
              rounded
              text-sm
              transition
              z-20
            "
          >
            {isSidebarCollapsed ? "◀" : "▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
