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
  /** 내가 보낸 메시지인지 */
  isMe: boolean;
}

/**
 * 사이드바 탭 타입
 * - ai: AI 어시스턴트 탭
 * - chat: 텍스트 채팅 탭
 * 추후 ai는 따로 ts파일 만들어서 분류할예정(현지)
 */
export type TabType = "ai" | "chat";

/**
 * 오른쪽 사이드바 상태
 * - collapsed: 사이드바 접힘/펼침 상태
 * - activeTab: 현재 활성화된 탭
 */
export interface SidebarState {
  collapsed: boolean;
  activeTab: TabType;
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
