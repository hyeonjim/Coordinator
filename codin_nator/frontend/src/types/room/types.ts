import type { NavigateFunction } from "react-router-dom";
import type { ChatMessage, UseRoomChatReturn } from "@/types/room/chat/textchat/types";
import type { UseRoomVoiceReturn } from "@/types/room/chat/voicechat/types";

/**
 * 방 참여자 기본 정보
 */
export interface Participant {
  userId: string;
  userName: string;
  imageUrl?: string;
  isSpeaking: boolean;
  micOn: boolean;
}

/**
 * useRoomSetup 훅 반환 타입
 */
export interface UseRoomSetupReturn {
  userId: string;
  userName: string;
  userImageUrl?: string;
  webSocketUrl: string;
  currentRoomId: string;
  isJoined: boolean;
  setIsJoined: React.Dispatch<React.SetStateAction<boolean>>;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

// 룸 헤더 관련 타입

export type Theme = "dark" | "light" | "light2";

export interface GitAction {
  id: string;
  label: string;
}

export interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
  selectedFileId: number | null;
  editorContent: string;
}

/**
 * useRoomActions 훅 파라미터
 * 각 통합 훅의 반환 타입을 직접 전달받습니다.
 */
export interface UseRoomActionsParams {
  roomSetup: UseRoomSetupReturn;
  roomChat: UseRoomChatReturn;
  roomVoice: UseRoomVoiceReturn;
  navigate: NavigateFunction;
}
