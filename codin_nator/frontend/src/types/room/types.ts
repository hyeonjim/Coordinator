import type { NavigateFunction } from "react-router-dom";
import type { ChatMessage, UseRoomChatReturn } from "@/types/room/chat/textchat/types";
import type { UseRoomVoiceReturn } from "@/types/room/chat/voicechat/types";

// ─── 참여자 ──────────────────────────────────────────────────────────────────

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

// ─── 훅 반환 / 파라미터 ──────────────────────────────────────────────────────

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

// ─── 파일 / 에디터 ──────────────────────────────────────────────────────────

export interface SelectedFile {
  id: number;
  name: string;
  content: string;
}

// ─── 헤더 / UI ───────────────────────────────────────────────────────────────

export type Theme = "dark" | "light" | "light2";

export interface GitAction {
  id: string;
  label: string;
}

export interface HeaderProps {
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

// ─── Context ─────────────────────────────────────────────────────────────────

/**
 * RoomContext 공유 값
 * RoomProvider 내부에서 생성되며 useRoomContext()로 접근합니다.
 */
export interface RoomContextValue {
  // 사용자 정보
  userId: string;
  userName: string;
  userImageUrl?: string;
  currentRoomId: string;

  // 방 상태
  isJoined: boolean;
  participants: Participant[];
  chatMessages: ChatMessage[];

  // UI 상태
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  // 음성 채팅
  isWebSocketConnected: boolean;
  handleToggleMic: () => Promise<void>;
  togglePeerMute: (peerId: string) => void;
  isPeerMuted: (peerId: string) => boolean;

  // 방 액션
  handleJoin: () => Promise<void>;
  handleLeave: () => void;
  handleSendChat: (text: string) => void;
}
