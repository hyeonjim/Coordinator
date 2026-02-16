/**
 * useRoomSetup.ts - 방 초기 설정 및 상태 관리 훅
 *
 * [이 훅의 역할]
 * 방(Room)에 필요한 모든 초기 상태를 한 곳에서 관리합니다:
 * - 사용자 정보 (userId, userName, imageUrl)
 * - WebSocket URL 계산
 * - 방 참여 상태 (isJoined)
 * - 참여자 목록, 채팅 메시지, 에디터/터미널 상태
 * - UI 상태 (사이드바 접힘 여부)
 *
 * [커스텀 훅(Custom Hook) 패턴]
 * - "use"로 시작하는 함수로, 내부에서 React 훅(useState, useEffect 등)을 사용
 * - 관련된 상태와 로직을 하나로 묶어 재사용 가능하게 만드는 패턴
 * - 컴포넌트에서 복잡한 로직을 분리하여 가독성과 유지보수성 향상
 *
 * [useState란?]
 * - 컴포넌트의 상태 값과 그 값을 갱신하는 함수를 반환
 * - const [value, setValue] = useState(초기값)
 * - setValue()를 호출하면 컴포넌트가 리렌더링되어 UI가 갱신됨
 *
 * @param roomId - URL 파라미터에서 가져온 방 ID
 * @returns 사용자 정보, 방 상태, UI 상태 및 상태 업데이트 함수들
 */
import { useEffect, useMemo, useState } from "react";
import type { UseRoomSetupReturn, Participant, SelectedFile } from "@/types/room";
import type { ChatMessage } from "@/types/chat";
import { generateId } from "@/utils/room/idGenerator";
import { useAuthStore } from "@/stores/authStore";
import { getSignalingWebSocketUrl } from "@/utils/socketUtils";
import axiosInstance from "@/services/api/axios";
import { ROOM_ENDPOINTS } from "@/services/api/endpoints";
export function useRoomSetup(roomId: string | undefined): UseRoomSetupReturn {
  const { user } = useAuthStore();

  /**
   * 사용자 정보 초기화
   * - useMemo(() => ..., []): 빈 의존성 배열 → 컴포넌트 최초 마운트 시 한 번만 실행
   * - WebRTC 시그널링에서 사용자를 식별하기 위한 세션별 고유 ID 생성
   */
  const userId = useMemo(() => generateId("user"), []);
  const userName = useMemo(
    () => user?.name ?? `사용자_${userId.slice(-4)}`,
    [userId, user?.name],
  );
  const userImageUrl = user?.imageUrl;

  const webSocketUrl = useMemo(
    () =>
      (import.meta.env.VITE_SIGNALING_URL as string) ||
      `${getSignalingWebSocketUrl()}/ws-signaling`,
    [],
  );
  const currentRoomId = roomId ?? "";

  // 방 상태 관리
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  // 에디터 / 터미널 상태
  const [editorCode, setEditorCode] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");

  // UI 상태 관리
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  /**
   * 방 참가자 DB 등록
   * - isJoined가 true로 바뀌는 순간 1회 호출
   * - REST API(POST)로 서버에 참가 정보를 저장
   * - .catch(() => {}): 에러 발생 시 무시 (네트워크 오류 등)
   */
  useEffect(() => {
    if (!isJoined || !currentRoomId) return;
    const numericRoomId = Number(currentRoomId);
    axiosInstance.post(ROOM_ENDPOINTS.JOIN(numericRoomId)).catch(() => {});
  }, [isJoined, currentRoomId]);

  return useMemo(
    () => ({
      userId,
      userName,
      userImageUrl,
      webSocketUrl,
      currentRoomId,
      isJoined,
      setIsJoined,
      participants,
      setParticipants,
      chatMessages,
      setChatMessages,
      selectedFile,
      setSelectedFile,
      editorCode,
      setEditorCode,
      terminalOutput,
      setTerminalOutput,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
    }),
    [
      userId,
      userName,
      userImageUrl,
      webSocketUrl,
      currentRoomId,
      isJoined,
      participants,
      chatMessages,
      selectedFile,
      editorCode,
      terminalOutput,
      isSidebarCollapsed,
    ],
  );
}
