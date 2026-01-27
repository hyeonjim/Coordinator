import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FileViewer from "../../components/room/file-viewer";
import RoomTerminal from "../../components/room/room-terminal";

import { useWebSocket } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";

import { VoiceChat } from "../../components/room/chat/VoiceChat";
import { TextChat } from "../../components/room/chat/TextChat";
import Header from "../../components/room/Header";

import type { ChatMessage, Participant } from "../../types/chat/types";

/**
 * 랜덤 ID 생성 유틸
 */
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // 사용자 정보
  const userId = useMemo(() => generateId("user"), []);
  const userName = useMemo(() => `사용자_${userId.slice(-4)}`, [userId]);
  const wsUrl = useMemo(
    () => (import.meta.env.VITE_SIGNALING_URL as string) || "",
    [],
  );
  const safeRoomId = roomId ?? "";

  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"ai" | "chat">("chat");

  // 커스텀 훅 연결
  const ws = useWebSocket(wsUrl);
  const rtc = useWebRTC();

  // 참여자 관리 함수
  const addParticipant = useCallback((id: string, name: string) => {
    setParticipants((prev) => {
      if (prev.some((p) => p.userId === id)) return prev;
      return [
        ...prev,
        { userId: id, userName: name, isSpeaking: false, micOn: true },
      ];
    });
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.userId !== id));
  }, []);

  // WebSocket 메시지 수신 처리
  useEffect(() => {
    const msg = ws.lastMessage;
    if (!msg) return;

    const handleMessage = async () => {
      switch (msg.type) {
        case "joined":
          setIsJoined(true);
          for (const peer of msg.peers) {
            if (peer.userId !== userId) {
              addParticipant(peer.userId, peer.userName);
              const offer = await rtc.createOffer(peer.userId);
              if (offer)
                ws.send({
                  type: "offer",
                  roomId: safeRoomId,
                  from: userId,
                  to: peer.userId,
                  sdp: offer,
                });
            }
          }
          break;
        case "peer-joined":
          if (msg.userId !== userId) addParticipant(msg.userId, msg.userName);
          break;
        case "offer":
          if (msg.to === userId) {
            const answer = await rtc.handleOffer(msg.from, msg.sdp);
            if (answer)
              ws.send({
                type: "answer",
                roomId: safeRoomId,
                from: userId,
                to: msg.from,
                sdp: answer,
              });
          }
          break;
        case "answer":
          if (msg.to === userId) await rtc.handleAnswer(msg.from, msg.sdp);
          break;
        case "ice":
          if (msg.to === userId) await rtc.handleIce(msg.from, msg.candidate);
          break;
        case "peer-left":
          removeParticipant(msg.userId);
          rtc.removePeer(msg.userId);
          break;
        case "chat":
          setChatMessages((prev) => [
            ...prev,
            {
              id: generateId("msg"),
              userId: msg.userId,
              userName: msg.userName,
              message: msg.message,
              timestamp: msg.timestamp,
              isMe: msg.userId === userId,
            },
          ]);
          break;
      }
    };
    handleMessage();
  }, [
    ws.lastMessage,
    userId,
    safeRoomId,
    addParticipant,
    removeParticipant,
    rtc,
    ws,
  ]);

  // 방 참여 핸들러
  const handleJoin = useCallback(async () => {
    if (!safeRoomId) return;
    try {
      await rtc.startAudio();
      ws.connect();
      setTimeout(() => {
        ws.send({ type: "join", roomId: safeRoomId, userId, userName });
        addParticipant(userId, userName);
      }, 300);
    } catch (error) {
      console.error("입장 실패:", error);
      alert(
        "마이크 권한을 허용해주셔야 음성 채팅 서비스를 이용하실 수 있습니다.",
      );
    }
  }, [safeRoomId, userId, userName, rtc, ws, addParticipant]);

  const handleJoinAction = useCallback(async () => {
    await handleJoin();
    setIsJoined(true);
  }, [handleJoin]);

  // 방 퇴장 핸들러
  const handleLeave = () => {
    ws.send({ type: "leave", roomId: safeRoomId, userId });
    rtc.stopAudio();
    ws.disconnect();
    setIsJoined(false);
    setParticipants([]);
    setChatMessages([]);
    navigate("/home", { replace: true });
  };

  // 채팅 접었다 펴기
  const [collapsed, setCollapsed] = useState(false);

  // 채팅 전송 핸들러
  const handleSendChat = (text: string) => {
    const timestamp = Date.now();
    ws.send({
      type: "chat",
      roomId: safeRoomId,
      userId,
      userName,
      message: text,
      timestamp,
    });
    setChatMessages((prev) => [
      ...prev,
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

  // 참여자 상태 동기화 (0.1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.userId === userId) {
            return { ...p, isSpeaking: rtc.isSpeaking, micOn: rtc.isMicOn };
          }
          return { ...p, isSpeaking: rtc.getPeerSpeaking(p.userId) };
        }),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isJoined, userId, rtc]);

  // 테스트용 코드
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
    const message = messages[Math.floor(Math.random() * messages.length)];
    setChatMessages((prev) => [
      ...prev,
      {
        id: generateId("msg"),
        userId: TEST_USER_ID,
        userName: TEST_USER_NAME,
        message,
        timestamp: Date.now(),
        isMe: false,
      },
    ]);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 1. 상단 헤더 */}
      <Header
        isJoined={isJoined}
        onJoin={handleJoinAction}
        onLeave={handleLeave}
      />

      {/* 2. 메인 컨텐츠 (3단 레이아웃) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 사이드바 (파일 + 음성 채팅) */}
        <aside className="w-64 flex flex-col">
          <div className="flex-1 overflow-auto">
            {/* 파일 익스플로러 */}
            <FileViewer roomId={Number(safeRoomId)} />
          </div>

          {/* 음성 채팅 섹션 */}
          <div className="h-1/3 flex flex-col">
            <div className="p-2 flex-1 overflow-hidden">
              <VoiceChat
                participants={participants}
                myUserId={userId}
                onToggleMic={rtc.toggleMic}
                onTogglePeerMute={rtc.togglePeerMute}
                isPeerMuted={rtc.isPeerMuted}
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
                    onClick={() => rtc.simulateIncomingAudio(TEST_USER_ID)}
                    className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded hover:bg-rose-700"
                  >
                    상대방 음성확인
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${ws.isConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-[10px] text-slate-500">
                    {ws.isConnected ? "WS Connected" : "WS Disconnected"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 중앙 메인 (에디터 + 터미널) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          <div className="flex-1 relative">
            {/* 에디터 플레이스홀더 */}
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <span className="text-white opacity-20 text-4xl font-light">
                Editor Area
              </span>
            </div>
          </div>
          <div className="h-64 border-t border-slate-700 bg-[#1e1e1e]">
            {/* 터미널 */}
            <RoomTerminal
              projectName="codin_nator"
              branchName="main"
              userName={userName}
              command="npm test"
              output={`PASS  src/App.test.jsx
✓ 화면에 Hello React가 보인다 (32 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total`}
              status={{
                language: "Java",
                encoding: "UTF-8",
                connectedUsers: participants.length,
                cursorInfo: "Ln 1, Col 1",
              }}
            />
          </div>
        </main>

        {/* 오른쪽 사이드바 (AI / 채팅 탭) */}
        {/* 탭 접었다 펴기 전체 수정 */}
        <div className="relative h-full flex">
          <div
            className={`

              h-full
              transition-all
              duration-300
              ease-in-out
              overflow-hidden
              ${collapsed ? "w-0" : "w-80"}

            `}
          >
            <aside className="h-full w-80 border-l border-slate-200 bg-white flex flex-col">
              {/* 탭 헤더 */}
              <div className="h-10 flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 text-sm font-medium transition-colors ${activeTab === "ai" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/20" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  AI 기능
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 text-sm font-medium transition-colors ${activeTab === "chat" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/20" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  채팅방
                </button>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {activeTab === "ai" ? (
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
          <button
            onClick={() => setCollapsed((v) => !v)}
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
            {collapsed ? "◀" : "▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
