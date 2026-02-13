import { useCallback, useMemo } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { UseRoomActionsParams, RoomContextValue } from "@/types/room/types";
import { generateId } from "@/utils/room/idGenerator";
import { useRoomSetup } from "./useRoomSetup";
import { useRoomChat } from "./useRoomChat";
import { useRoomVoice } from "./useRoomVoice";

/**
 * 방 입장/퇴장 및 채팅 전송 훅
 * 방과 관련된 주요 액션들을 관리합니다.
 *
 * @param params - 훅 파라미터 (roomSetup, roomChat, roomVoice, navigate)
 * @returns 방 액션 함수들 (handleJoin, handleLeave, handleSendChat)
 */
export function useRoomActions({
  roomSetup,
  roomChat,
  roomVoice,
  navigate,
}: UseRoomActionsParams) {
  // roomSetup에서 필요한 값 추출
  const {
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    setIsJoined,
    setParticipants,
    setChatMessages,
  } = roomSetup;

  // roomChat에서 필요한 값 추출
  const { textChatWebSocket } = roomChat;

  // roomVoice에서 필요한 값 추출
  const { webRTC, voiceChatWebSocket } = roomVoice;
  /**
   * 방에 입장합니다.
   * 1. 마이크 권한 요청 및 오디오 스트림 시작
   * 2. WebSocket 연결 (WebRTC 시그널링용)
   * 3. STOMP 연결 (텍스트 채팅용)
   * 4. 입장 메시지 전송 (WebRTC + 텍스트 채팅)
   */
  const handleJoin = useCallback(async () => {
    if (!currentRoomId) return;

    try {
      // 1. 마이크 권한 요청 및 오디오 스트림 시작
      await webRTC.startAudio();

      // 2. STOMP 연결 (텍스트 채팅용)
      textChatWebSocket.connect();

      setTimeout(() => {
        // 1. 텍스트 채팅 입장 메시지 (STOMP)
        // message를 빈 문자열로 전송하면, 서버가 "{sender}님이 입장하셨습니다."로 자동 생성
        textChatWebSocket.sendMessage({
          roomId: currentRoomId,
          sender: userName,
          message: "",
          type: "ENTER",
          imageUrl: userImageUrl,
        });

        setIsJoined(true);
      }, 300);
    } catch {
      alert(
        "마이크 권한을 허용해주셔야 음성 채팅 서비스를 이용하실 수 있습니다.",
      );
    }
  }, [
    currentRoomId,
    userName,
    userImageUrl,
    webRTC,
    textChatWebSocket,
    setIsJoined,
  ]);

  /**
   * 방에서 퇴장합니다.
   * 1. 퇴장 메시지 전송 (텍스트 채팅)
   * 2. 오디오 스트림 정지
   * 3. WebSocket 연결 종료 (WebRTC + 텍스트 채팅)
   * 4. 상태 초기화
   * 5. 홈 화면으로 이동
   */
  const handleLeave = useCallback(() => {
    if (!currentRoomId) return;

    // 1. 텍스트 채팅 퇴장 메시지 (STOMP)
    // message를 빈 문자열로 전송하면, 서버가 "{sender}님이 퇴장하셨습니다."로 자동 생성
    try {
      textChatWebSocket.sendMessage({
        roomId: currentRoomId,
        sender: userName,
        message: "",
        type: "LEAVE",
        imageUrl: userImageUrl,
      });
    } catch {
      // 퇴장 메시지 전송 실패 시 무시
    }

    // 짧은 딜레이 후 퇴장 처리 (메시지 전송 완료 대기)
    setTimeout(() => {
      // 2. 오디오 스트림 정지
      webRTC.stopAudio();

      // 3. WebSocket 연결 종료
      textChatWebSocket.disconnect(); // 텍스트 채팅 STOMP
      voiceChatWebSocket.disconnect(); // VoiceChat STOMP (WebRTC signaling 포함)

      // 4. 상태 초기화
      setIsJoined(false);
      setParticipants([]);
      setChatMessages([]);

      // 5. 홈 화면으로 이동
      navigate("/home", { replace: true });
    }, 100);
  }, [
    currentRoomId,
    userName,
    userImageUrl,
    webRTC,
    textChatWebSocket,
    voiceChatWebSocket,
    setIsJoined,
    setParticipants,
    setChatMessages,
    navigate,
  ]);

  /**
   * 텍스트 채팅 메시지를 전송합니다.
   * 1. STOMP를 통해 서버로 전송
   * 2. 로컬 채팅 목록에 추가 (즉시 UI 업데이트)
   *
   * 주의: WebRTC 시그널링이 아닌 STOMP로 메시지를 전송합니다.
   * 백엔드 TextChatController가 STOMP 메시지만 처리합니다.
   */
  const handleSendChat = useCallback(
    (text: string) => {
      // 1. STOMP를 통해 메시지 전송
      // 발행 경로: /pub/chat/message
      // 백엔드 컨트롤러의 @MessageMapping("/chat/message")가 수신
      textChatWebSocket.sendMessage({
        roomId: currentRoomId,
        sender: userName,
        message: text,
        type: "TALK",
        imageUrl: userImageUrl,
      });

      // 2. 로컬 UI에 즉시 반영
      // 서버 브로드캐스트를 기다리지 않고 바로 표시 (UX 향상)
      const timestamp = Date.now();
      setChatMessages((previousMessages) => [
        ...previousMessages,
        {
          id: generateId("message"),
          userId,
          userName,
          imageUrl: userImageUrl,
          message: text,
          timestamp,
          isMe: true,
        },
      ]);
    },
    [
      currentRoomId,
      userId,
      userName,
      userImageUrl,
      textChatWebSocket,
      setChatMessages,
    ],
  );

  return useMemo(
    () => ({ handleJoin, handleLeave, handleSendChat }),
    [handleJoin, handleLeave, handleSendChat],
  );
}

/**
 * Room 전체 상태 및 액션을 통합하는 훅
 * RoomProvider 내부에서 사용되며 RoomContextValue를 반환합니다.
 *
 * @param roomId - URL 파라미터에서 가져온 방 ID
 * @param navigate - react-router-dom navigate 함수
 */
export function useRoom(
  roomId: string | undefined,
  navigate: NavigateFunction,
): RoomContextValue {
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

  // 텍스트 채팅 통합 훅
  const roomChat = useRoomChat({ currentRoomId, userName, isJoined, setChatMessages });

  // 음성 채팅 통합 훅
  const roomVoice = useRoomVoice({
    currentRoomId,
    userId,
    userName,
    userImageUrl,
    isJoined,
    setParticipants,
  });
  const { isWebSocketConnected, handleToggleMic, togglePeerMute, isPeerMuted } = roomVoice;

  // 방 입장/퇴장/채팅 전송 훅
  const { handleJoin, handleLeave, handleSendChat } = useRoomActions({
    roomSetup,
    roomChat,
    roomVoice,
    navigate,
  });

  return useMemo(
    () => ({
      userId,
      userName,
      userImageUrl,
      currentRoomId,
      isJoined,
      participants,
      chatMessages,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      isWebSocketConnected,
      handleToggleMic,
      togglePeerMute,
      isPeerMuted,
      handleJoin,
      handleLeave,
      handleSendChat,
    }),
    [
      userId, userName, userImageUrl, currentRoomId,
      isJoined, participants, chatMessages,
      isSidebarCollapsed, setIsSidebarCollapsed,
      isWebSocketConnected, handleToggleMic, togglePeerMute, isPeerMuted,
      handleJoin, handleLeave, handleSendChat,
    ],
  );
}
