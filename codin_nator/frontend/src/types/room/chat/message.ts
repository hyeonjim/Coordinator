/**
 * 텍스트 채팅 메시지 타입
 */
export interface ChatMessage {
  /** 메시지 고유 ID */
  id: string;
  /** 발신자 ID */
  userId: string;
  /** 발신자 이름 */
  userName: string;
  /** 메시지 내용 */
  message: string;
  /** 발송 시간 (Unix timestamp) */
  timestamp: number;
  /** 프로필 이미지 URL */
  imageUrl?: string;
  /** 내가 보낸 메시지인지 */
  isMe: boolean;
  /** 메시지 타입: ENTER(입장), TALK(채팅), LEAVE(퇴장) */
  type?: "ENTER" | "TALK" | "LEAVE";
}

/**
 * 사이드바 탭 타입
 */
export type TabType = "chat";

/**
 * 오른쪽 사이드바 상태
 */
export interface SidebarState {
  collapsed: boolean;
  activeTab: TabType;
}

/**
 * 메시지 버블 컴포넌트 Props
 */
export interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * TextChat 컴포넌트 Props 타입
 */
export interface TextChatProps {
  /** 채팅 메시지 목록 */
  messages: ChatMessage[];
  /** 메시지 전송 핸들러 */
  onSendMessage: (text: string) => void;
  /** 비활성화 여부 (방 미참여 시) */
  disabled?: boolean;
  /** 활성 탭 */
  activeTab: TabType;
  /** 탭 변경 핸들러 */
  setActiveTab: (tab: TabType) => void;
  /** 사이드바 축소 여부 */
  isSidebarCollapsed: boolean;
  /** 사이드바 축소 상태 변경 */
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}
