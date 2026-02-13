import type { NavigateFunction } from "react-router-dom";
import type {
  ChatMessage,
  UseRoomChatReturn,
} from "@/types/room/chat/textchat/types";
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

// ─── 파일 / 에디터 ──────────────────────────────────────────────────────────

export interface SelectedFile {
  id: number;
  name: string;
  content: string;
}

// ─── 훅 반환 / 파라미터 ──────────────────────────────────────────────────────

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
  selectedFile: SelectedFile | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile | null>>;
  editorCode: string;
  setEditorCode: React.Dispatch<React.SetStateAction<string>>;
  terminalOutput: string;
  setTerminalOutput: React.Dispatch<React.SetStateAction<string>>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export type Theme = "dark" | "light" | "light2";

export interface GitAction {
  id: string;
  label: string;
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

/**
 * RoomContext 공유 값
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

  // 파일 선택 상태
  selectedFile: SelectedFile | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile | null>>;

  // 에디터 / 터미널 상태
  editorCode: string;
  setEditorCode: React.Dispatch<React.SetStateAction<string>>;
  terminalOutput: string;
  appendTerminal: (title: string, text: string) => void;

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
