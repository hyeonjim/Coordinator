/**
 * Room 페이지 UI 관련 타입 정의
 */

/**
 * 사이드바 탭 타입
 * - ai: AI 어시스턴트 탭
 * - chat: 텍스트 채팅 탭
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
