import { useMemo, useState } from "react";
import type { UseRoomSetupReturn } from "@/types/room/types";
import type { ChatMessage, TabType } from "@/types/chat/message";
import type { Participant } from "@/types/chat/voicetypes";
import { generateId } from "@/utils/room/idGenerator";

/**
 * 방 초기 설정 및 상태 관리 훅
 * 사용자 정보 초기화와 방 상태, UI 상태를 통합 관리합니다.
 *
 * @param roomId - URL 파라미터에서 가져온 방 ID
 * @returns 사용자 정보, 방 상태, UI 상태 및 상태 업데이트 함수들
 */
export function useRoomSetup(roomId: string | undefined): UseRoomSetupReturn {
  // 사용자 정보 초기화
  const userId = useMemo(() => generateId("user"), []);
  const userName = useMemo(() => `사용자_${userId.slice(-4)}`, [userId]);
  const webSocketUrl = useMemo(
    () => (import.meta.env.VITE_SIGNALING_URL as string) || "",
    [],
  );
  const currentRoomId = roomId ?? "";

  // 방 상태 관리
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // UI 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return {
    // 사용자 정보
    userId,
    userName,
    webSocketUrl,
    currentRoomId,
    // 방 상태
    isJoined,
    setIsJoined,
    participants,
    setParticipants,
    chatMessages,
    setChatMessages,
    // UI 상태
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  };
}
