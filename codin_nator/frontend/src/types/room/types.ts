import type { NavigateFunction } from "react-router-dom";
import type { ChatMessage } from "@/types/room/chat/textchat/types";
import type { UseWebRTCReturn } from "@/types/room/chat/voicechat/webrtc";
import type { UseWebSocketReturn } from "@/types/room/chat/websocket";
import type { UseTextChatWebSocketReturn } from "@/types/room/chat/textchat/types";
import type { UseVoiceChatWebSocketReturn } from "@/types/room/chat/voicechat/types";

/**
 * 시그널링 서버로 보내는/받는 모든 메시지 타입
 */
export type SignalMessage =
  // 방 입장 요청
  | {
      type: "join";
      roomId: string;
      userId: string;
      userName: string;
      imageUrl?: string;
    }
  // 방 입장 성공 응답
  | { type: "joined"; roomId: string; userId: string; peers: Participant[] }
  // 새 참여자 알림
  | {
      type: "peer-joined";
      roomId: string;
      userId: string;
      userName: string;
      imageUrl?: string;
    }
  // WebRTC Offer (연결 제안)
  | {
      type: "offer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  // WebRTC Answer (연결 응답)
  | {
      type: "answer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  // ICE Candidate (네트워크 경로 정보)
  | {
      type: "ice";
      roomId: string;
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    }
  // 방 퇴장
  | { type: "leave"; roomId: string; userId: string }
  // 참여자 퇴장 알림
  | { type: "peer-left"; roomId: string; userId: string };

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

export interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

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
  setIsJoined: React.Dispatch<React.SetStateAction<boolean>>;
}

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
