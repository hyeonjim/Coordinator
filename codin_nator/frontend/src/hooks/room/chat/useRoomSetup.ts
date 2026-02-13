import { useEffect, useMemo, useState } from "react";
import type { UseRoomSetupReturn, Participant } from "@/types/room/types";
import type { ChatMessage } from "@/types/room/chat/textchat/types";
import { generateId } from "@/utils/room/idGenerator";
import { useAuthStore } from "@/stores/authStore";
import { getSignalingWebSocketUrl } from "@/utils/socketUtils";
import axiosInstance from "@/api/axios";

/**
 * 방 초기 설정 및 상태 관리 훅
 * 사용자 정보 초기화와 방 상태, UI 상태를 통합 관리합니다.
 *
 * @param roomId - URL 파라미터에서 가져온 방 ID
 * @returns 사용자 정보, 방 상태, UI 상태 및 상태 업데이트 함수들
 */
export function useRoomSetup(roomId: string | undefined): UseRoomSetupReturn {
  const { user } = useAuthStore();

  // 사용자 정보 초기화
  // WebRTC 식별을 위해 세션별로 고유한 임시 ID를 사용합니다.
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

  // UI 상태 관리
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 방 참가자 DB 등록 (isJoined=true 순간 1회 호출)
  useEffect(() => {
    if (!isJoined || !currentRoomId) return;
    axiosInstance.post(`/v1/room/${currentRoomId}/participants/me`).catch(() => {});
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
      setIsJoined,
      participants,
      setParticipants,
      chatMessages,
      setChatMessages,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
    ],
  );
}
