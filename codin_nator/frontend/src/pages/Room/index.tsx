/**
 * Room 페이지 - 메인 컴포넌트
 * ============================
 * WebRTC 음성채팅과 WebSocket 텍스트채팅을 통합한 Room 페이지입니다.
 * 
 * 💡 학습 포인트:
 * - 커스텀 훅으로 복잡한 로직 분리
 * - useEffect로 메시지 이벤트 처리
 * - 컴포넌트 조합으로 UI 구성
 * 
 * 📁 파일 구조:
 * Room/
 * ├── index.tsx (이 파일) - 메인 페이지
 * ├── types.ts - 타입 정의
 * ├── hooks/
 * │   ├── useWebSocket.ts - WebSocket 관리
 * │   └── useWebRTC.ts - WebRTC 관리
 * └── components/
 *     ├── ParticipantList.tsx - 참여자 목록
 *     ├── VoiceChat.tsx - 음성 채팅 제어
 *     └── TextChat.tsx - 텍스트 채팅
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 커스텀 훅
import { useWebSocket } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";

// UI 컴포넌트
import { ParticipantList } from "./components/ParticipantList";
import { VoiceChat } from "./components/VoiceChat";
import { TextChat } from "./components/TextChat";

// 타입
import type { ChatMessage, Participant, SignalMessage } from "./types";

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 랜덤 ID 생성
 * 
 * 💡 간단한 고유 ID 생성 (실제로는 UUID 라이브러리 사용 권장)
 */
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // 💡 useMemo로 고정값 메모이제이션 (리렌더링 시 재생성 방지)
  const userId = useMemo(() => generateId("user"), []);
  const userName = useMemo(() => `사용자_${userId.slice(-4)}`, [userId]);
  const wsUrl = useMemo(() => import.meta.env.VITE_SIGNALING_URL as string || "", []);
  const safeRoomId = roomId ?? "";

  // ============================================================
  // 상태 관리
  // ============================================================
  
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // ============================================================
  // 커스텀 훅 사용
  // ============================================================
  
  /**
   * 💡 복잡한 WebSocket/WebRTC 로직이 훅으로 캡슐화되어
   *    메인 컴포넌트가 간결해짐
   */
  const ws = useWebSocket(wsUrl);
  const rtc = useWebRTC();

  // ============================================================
  // 참여자 관리 함수
  // ============================================================
  
  const addParticipant = useCallback((id: string, name: string) => {
    setParticipants((prev) => {
      // 이미 있으면 무시
      if (prev.some((p) => p.userId === id)) return prev;
      return [...prev, { userId: id, userName: name, isSpeaking: false, micOn: true }];
    });
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.userId !== id));
  }, []);

  // ============================================================
  // WebSocket 메시지 핸들러
  // ============================================================
  
  /**
   * 💡 useEffect로 lastMessage 변화 감지
   * 
   * ws.lastMessage가 바뀔 때마다 실행되어
   * 메시지 타입에 따라 적절한 처리를 수행
   */
  useEffect(() => {
    const msg = ws.lastMessage;
    if (!msg) return;

    const handleMessage = async () => {
      switch (msg.type) {
        // 방 입장 성공
        case "joined": {
          setIsJoined(true);
          
          // 기존 참여자들을 목록에 추가하고 연결 시작
          for (const peer of msg.peers) {
            if (peer.userId !== userId) {
              addParticipant(peer.userId, peer.userName);
              
              // WebRTC Offer 생성 및 전송
              const offer = await rtc.createOffer(peer.userId);
              if (offer) {
                ws.send({
                  type: "offer",
                  roomId: safeRoomId,
                  from: userId,
                  to: peer.userId,
                  sdp: offer,
                });
              }
            }
          }
          break;
        }

        // 새 참여자 입장
        case "peer-joined": {
          if (msg.userId !== userId) {
            addParticipant(msg.userId, msg.userName);
          }
          break;
        }

        // WebRTC Offer 수신
        case "offer": {
          if (msg.to === userId) {
            const answer = await rtc.handleOffer(msg.from, msg.sdp);
            if (answer) {
              ws.send({
                type: "answer",
                roomId: safeRoomId,
                from: userId,
                to: msg.from,
                sdp: answer,
              });
            }
          }
          break;
        }

        // WebRTC Answer 수신
        case "answer": {
          if (msg.to === userId) {
            await rtc.handleAnswer(msg.from, msg.sdp);
          }
          break;
        }

        // ICE Candidate 수신
        case "ice": {
          if (msg.to === userId) {
            await rtc.handleIce(msg.from, msg.candidate);
          }
          break;
        }

        // 참여자 퇴장
        case "peer-left": {
          removeParticipant(msg.userId);
          rtc.removePeer(msg.userId);
          break;
        }

        // 채팅 메시지 수신
        case "chat": {
          const newMsg: ChatMessage = {
            id: generateId("msg"),
            userId: msg.userId,
            userName: msg.userName,
            message: msg.message,
            timestamp: msg.timestamp,
            isMe: msg.userId === userId,
          };
          setChatMessages((prev) => [...prev, newMsg]);
          break;
        }
      }
    };

    handleMessage();
  }, [ws.lastMessage, ws, rtc, userId, safeRoomId, addParticipant, removeParticipant]);

  // ============================================================
  // 액션 핸들러
  // ============================================================
  
  /**
   * 방 참여
   */
  const handleJoin = async () => {
    if (!safeRoomId) {
      alert("방 ID가 없습니다.");
      return;
    }

    try {
      // 마이크 권한 요청 및 오디오 시작
      await rtc.startAudio();
      
      // WebSocket 연결 및 방 참여
      ws.connect();
      
      // 연결 후 join 메시지 전송 (약간의 딜레이 필요)
      setTimeout(() => {
        ws.send({
          type: "join",
          roomId: safeRoomId,
          userId,
          userName,
        });
        
        // 자신을 참여자 목록에 추가
        addParticipant(userId, userName);
      }, 200);
      
    } catch (error) {
      alert("마이크 권한을 허용해주세요.");
    }
  };

  /**
   * 방 퇴장
   */
  const handleLeave = () => {
    // 서버에 퇴장 알림
    ws.send({
      type: "leave",
      roomId: safeRoomId,
      userId,
    });

    // 정리
    rtc.stopAudio();
    ws.disconnect();
    
    setIsJoined(false);
    setParticipants([]);
    setChatMessages([]);

    navigate("/home", { replace: true });
  };

  /**
   * 채팅 메시지 전송
   */
  const handleSendChat = (text: string) => {
    const msg: SignalMessage = {
      type: "chat",
      roomId: safeRoomId,
      userId,
      userName,
      message: text,
      timestamp: Date.now(),
    };
    
    ws.send(msg);
    
    // 내 메시지도 목록에 추가
    setChatMessages((prev) => [
      ...prev,
      {
        id: generateId("msg"),
        userId,
        userName,
        message: text,
        timestamp: Date.now(),
        isMe: true,
      },
    ]);
  };

  // ============================================================
  // 참여자 상태 업데이트 (음성 감지)
  // ============================================================
  
  /**
   * 💡 주기적으로 참여자들의 음성 상태 업데이트
   */
  useEffect(() => {
    if (!isJoined) return;

    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.userId === userId) {
            // 내 상태
            return { ...p, isSpeaking: rtc.isSpeaking, micOn: rtc.isMicOn };
          }
          // 다른 참여자 상태
          return { ...p, isSpeaking: rtc.getPeerSpeaking(p.userId) };
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isJoined, userId, rtc]);

  // ============================================================
  // 렌더링
  // ============================================================
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Room</h1>
            <p className="text-sm text-slate-500 font-mono">{safeRoomId || "ID 없음"}</p>
          </div>
          
          {/* 연결 상태 표시 */}
          <div className="flex gap-2">
            <span
              className={[
                "rounded-full px-2 py-1 text-xs font-medium",
                ws.isConnected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {ws.isConnected ? "연결됨" : "연결 안됨"}
            </span>
          </div>
        </div>

        {/* 음성 채팅 제어 */}
        <VoiceChat
          isMicOn={rtc.isMicOn}
          isSpeaking={rtc.isSpeaking}
          isJoined={isJoined}
          onToggleMic={rtc.toggleMic}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />

        {/* 참여자 목록 */}
        <ParticipantList participants={participants} myUserId={userId} />

        {/* 텍스트 채팅 */}
        <TextChat
          messages={chatMessages}
          onSendMessage={handleSendChat}
          disabled={!isJoined}
        />
      </div>
    </div>
  );
}
