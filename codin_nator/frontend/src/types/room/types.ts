import type { NavigateFunction } from "react-router-dom";
import type { ChatMessage, TabType } from "@/types/chat/message";
import type { UseWebRTCReturn } from "@/types/chat/webrtc";
import type { UseWebSocketReturn } from "@/types/chat/websocket";
import type {
  UseTextChatWebSocketReturn,
  UseVoiceChatWebSocketReturn,
} from "@/types/chat/stomp";
import type { Participant } from "@/types/chat/voicetypes";

/**
 * useRoomSetup 훅의 반환 타입
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
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Header 컴포넌트 Props
 */
export interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

/**
 * DebugPanel 컴포넌트 Props
 */
export interface DebugPanelProps {
  onTestUserJoin: () => void;
  onTestUserMessage: () => void;
  onSimulateAudio: () => void;
  isWebSocketConnected: boolean;
}

/**
 * createTestHelpers 함수 파라미터 타입
 */
export interface CreateTestHelpersParams {
  addParticipant: (
    id: string,
    name: string,
    imageUrl?: string,
    micOn?: boolean,
  ) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  webRTC: UseWebRTCReturn;
}

/**
 * useWebSocketMessageHandler 훅 파라미터 타입
 */
export interface UseWebSocketMessageHandlerParams {
  webSocket: UseWebSocketReturn;
  webRTC: UseWebRTCReturn;
  userId: string;
  currentRoomId: string;
  addParticipant: (
    id: string,
    name: string,
    imageUrl?: string,
    micOn?: boolean,
  ) => void;
  removeParticipant: (id: string) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsJoined: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * useRoomActions 훅 파라미터 타입
 */
export interface UseRoomActionsParams {
  currentRoomId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  webRTC: UseWebRTCReturn;
  textChatWebSocket: UseTextChatWebSocketReturn;
  voiceChatWebSocket: UseVoiceChatWebSocketReturn;
  setIsJoined: React.Dispatch<React.SetStateAction<boolean>>;
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  navigate: NavigateFunction;
}

/**
 * useParticipantManagement 훅 파라미터 타입
 */
export interface UseParticipantManagementParams {
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  userId: string;
  userName: string;
  userImageUrl?: string;
  webRTC: UseWebRTCReturn;
  isJoined: boolean;
}
