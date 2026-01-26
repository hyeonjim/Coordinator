/**
 * 1. useEffect를 사용한 자동 참여(Auto-join) 구현
 * 2. 커스텀 훅(useWebSocket, useWebRTC)을 통한 로직 분리
 * 3. 주기적인 상태 대입 기능을 통한 참여자 음성 상태 연동
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 커스텀 훅
import { useWebSocket } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";

// UI 컴포넌트
import { ParticipantList } from "../../components/room/VoiceChat";
import { TextChat } from "../../components/room/TextChat";

// 타입
import type {
  ChatMessage,
  Participant,
  SignalMessage,
} from "../../types/room/types";

/**
 * 랜덤 ID 생성 자바스크립트 기본 기능을 활용한 예시
 */
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // 1. 기본 사용자 정보 설정 (고정값)
  const userId = useMemo(() => generateId("user"), []);
  const userName = useMemo(() => `사용자_${userId.slice(-4)}`, [userId]);
  const wsUrl = useMemo(
    () => (import.meta.env.VITE_SIGNALING_URL as string) || "",
    [],
  );
  const safeRoomId = roomId ?? "";

  // 2. 상태 관리
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 3. 커스범 훅 연결
  const ws = useWebSocket(wsUrl);
  const rtc = useWebRTC();

  // 참여자 관리 (추가/삭제)
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

  // 4. WebSocket 메시지 수신 및 WebRTC 시그널링 처리
  useEffect(() => {
    const msg = ws.lastMessage;
    if (!msg) return;

    const handleMessage = async () => {
      switch (msg.type) {
        case "joined": // 방 입장 성공 시 기존 참여자들과 연결 시작
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

        case "peer-joined": // 새 참여자 입장 시
          if (msg.userId !== userId) addParticipant(msg.userId, msg.userName);
          break;

        case "offer": // WebRTC 연결 제안 받음
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

        case "answer": // WebRTC 응답 받음
          if (msg.to === userId) await rtc.handleAnswer(msg.from, msg.sdp);
          break;

        case "ice": // 네트워크 경로 후보 받음
          if (msg.to === userId) await rtc.handleIce(msg.from, msg.candidate);
          break;

        case "peer-left": // 참여자 퇴장 시 리소스 정리
          removeParticipant(msg.userId);
          rtc.removePeer(msg.userId);
          break;

        case "chat": // 채팅 메시지 수신
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

  // 5. 방 참여 로직 (마이크 권한 획득 + WebSocket 연결)
  const handleJoin = useCallback(async () => {
    if (!safeRoomId) return;
    try {
      await rtc.startAudio(); // 마이크 켜기
      ws.connect(); // 서버 연결

      // 서버 연결 완료 후 룸 입장 메시지 전송
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

  // 7. 방 퇴장 및 정리 로직
  const handleLeave = () => {
    ws.send({ type: "leave", roomId: safeRoomId, userId });
    rtc.stopAudio();
    ws.disconnect();
    setIsJoined(false);
    setParticipants([]);
    setChatMessages([]);
    navigate("/home", { replace: true });
  };

  // 8. 채팅 전송 핸들러
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

  // 9. 주기적 참여자 상태 대입 (0.1초마다)
  /**
   * Local 정보(내 마이크 ON/OFF, 말하기 상태)는 rtc 훅의 상태를 직접 사용하고,
   * Remote 정보는 rtc 훅 내부의 ref 데이터(getPeerSpeaking)를 가져와서
   * 리액트 state(participants)에 주기적으로 반영해주어야 화면이 바뀝니다.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.userId === userId) {
            // 내 상태는 rtc 훅의 최신 상태를 그대로 대입
            return { ...p, isSpeaking: rtc.isSpeaking, micOn: rtc.isMicOn };
          }
          // 다른 참여자의 말하기 상태 가져오기
          return { ...p, isSpeaking: rtc.getPeerSpeaking(p.userId) };
        }),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isJoined, userId, rtc]);

  // 방 참여 로직 보강
  const handleJoinAction = useCallback(async () => {
    await handleJoin();
    setIsJoined(true); // 확실하게 상태 변경
  }, [handleJoin]);

  // 테스트용 시뮬레이션 코드 (개발용)

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

  // 최종 화면 렌더링
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* 헤더 영역: 룸 정보 및 나가기 버튼 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Room</h1>
            <p className="text-sm text-slate-500 font-mono">
              {safeRoomId || "ID 없음"}
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${ws.isConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
            >
              {ws.isConnected ? "연결됨" : "연결 안됨"}
            </span>
            {isJoined ? (
              <button
                onClick={handleLeave}
                className="ml-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 hover:bg-rose-100 transition-colors"
                title="음성 채팅 나가기"
              >
                나가기
              </button>
            ) : (
              <button
                onClick={handleJoinAction}
                className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
                title="음성 채팅 참여하기"
              >
                참여하기
              </button>
            )}
          </div>
        </div>

        {/* 참여자 목록 영역: 마이크 제어 통합 */}
        <ParticipantList
          participants={participants}
          myUserId={userId}
          onToggleMic={rtc.toggleMic}
          onTogglePeerMute={rtc.togglePeerMute}
          isPeerMuted={rtc.isPeerMuted}
        />

        {/* 채팅 영역 */}
        <TextChat
          messages={chatMessages}
          onSendMessage={handleSendChat}
          disabled={!isJoined}
        />

        {/* 하단 테스트 컨트롤 (개발 시 활용) */}
        <div className="mt-8 p-4 bg-slate-100 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-2">
            🛠️ 개발 테스트 도구
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={simulateTestUserJoin}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg"
            >
              가상 유저 입장
            </button>
            <button
              onClick={simulateTestUserMessage}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg"
            >
              가상 메시지 받기
            </button>
            <button
              onClick={() => rtc.simulateIncomingAudio(TEST_USER_ID)}
              className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-lg"
            >
              가상 음성 받기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
