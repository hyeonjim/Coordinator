/**
 * [병합 포인트 1] import 통합
 * - 기본 코드의 컴포넌트 + 내 코드의 훅/타입/컴포넌트
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 기본 코드의 컴포넌트
import FileViewer from "../../components/room/file-viewer";
import RoomTerminal from "../../components/room/room-terminal";

// 내 코드의 커스텀 훅
import { useWebSocket } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";

// 내 코드의 UI 컴포넌트
import { VoiceChat } from "../../components/room/chat/VoiceChat";
import { TextChat } from "../../components/room/chat/TextChat";

// 타입
import type { ChatMessage, Participant } from "../../types/room/types";

/**
 * 랜덤 ID 생성 유틸
 */
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  /**
   * [병합 포인트 2] 내 코드의 모든 상태/로직 가져오기
   */

  // 사용자 정보
  const userId = useMemo(() => generateId("user"), []);
  const userName = useMemo(() => `사용자_${userId.slice(-4)}`, [userId]);
  const wsUrl = useMemo(
    () => (import.meta.env.VITE_SIGNALING_URL as string) || "",
    [],
  );
  const safeRoomId = roomId ?? "";

  // 상태 관리
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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

  /**
   * [병합 포인트 3] JSX - 기본 코드 레이아웃에 내 코드 컴포넌트 삽입
   */
  return (
    <div className="h-screen flex">
      {/* 왼쪽 사이드바 */}
      <aside className="w-64 border-r flex flex-col">
        <div className="flex-1 overflow-auto">
          {/* 파일 익스플로러 */}
          <FileViewer />
        </div>
        <div className="border-t">
          {/* ✅ 음성채팅 - 내 코드에서 가져옴 */}
          <div className="p-2">
            {/* 연결 상태 & 참여/나가기 버튼 */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  ws.isConnected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {ws.isConnected ? "연결됨" : "연결 안됨"}
              </span>
              {isJoined ? (
                <button
                  onClick={handleLeave}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 hover:bg-rose-100"
                >
                  나가기
                </button>
              ) : (
                <button
                  onClick={handleJoinAction}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 hover:bg-emerald-100"
                >
                  참여하기
                </button>
              )}
            </div>
            {/* 참여자 목록 */}
            <VoiceChat
              participants={participants}
              myUserId={userId}
              onToggleMic={rtc.toggleMic}
              onTogglePeerMute={rtc.togglePeerMute}
              isPeerMuted={rtc.isPeerMuted}
            />
          </div>

          {/* ✅ 테스트 도구 - 개발 중에만 사용 */}
          {import.meta.env.DEV && (
            <div className="p-2 bg-slate-100 border-t">
              <p className="text-xs font-bold text-slate-600 mb-1">🛠️ 테스트</p>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={simulateTestUserJoin}
                  className="px-2 py-1 bg-emerald-600 text-white text-xs rounded"
                >
                  유저 입장
                </button>
                <button
                  onClick={simulateTestUserMessage}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                >
                  메시지
                </button>
                <button
                  onClick={() => rtc.simulateIncomingAudio(TEST_USER_ID)}
                  className="px-2 py-1 bg-rose-600 text-white text-xs rounded"
                >
                  음성
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col border-r">
        <div className="flex-1">{/* 에디터 */}</div>
        <div className="h-64 border-t">
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

      {/* 오른쪽 사이드바 */}
      <aside className="w-80 border flex flex-col">
        <div className="flex-1">{/* AI */}</div>
        <div className="h-1/2 border-t">
          {/* ✅ 텍스트 채팅 - 내 코드에서 가져옴 */}
          <TextChat
            messages={chatMessages}
            onSendMessage={handleSendChat}
            disabled={!isJoined}
          />
        </div>
      </aside>
    </div>
  );
}
