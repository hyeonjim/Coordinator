/**
 * Room 페이지 레이아웃 컴포넌트
 *
 * [레이아웃 구조]
 * ┌──────────────────────────────────────────────┐
 * │                   Header                      │
 * ├──────────┬─────────────────────┬──────────────┤
 * │ Sidebar  │    Code Editor      │  Text Chat   │
 * │ (파일뷰어)│                     │  (채팅 패널)  │
 * │          ├─────────────────────┤              │
 * │ Voice    │    Terminal         │              │
 * │ (음성채팅)│                     │              │
 * └──────────┴─────────────────────┴──────────────┘
 *
 * [Tailwind CSS 주요 클래스]
 * - flex: Flexbox 레이아웃 (자식 요소를 한 줄로 배치)
 * - flex-col: 세로 방향 Flexbox
 * - flex-1: 남은 공간을 모두 차지
 * - h-screen: 화면 전체 높이
 * - overflow-hidden: 넘치는 내용 숨김
 *
 * [CSS 변수 - 테마 시스템]
 * - bg-(--rc-bg): CSS 변수를 Tailwind v4에서 참조하는 문법
 * - --rc-*: Room Container 전용 CSS 변수 (style/index.css에서 정의)
 * - .room-container 클래스에 따라 다크/라이트 테마 자동 전환
 */

import { CodeEditorPanel } from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import { FileViewer } from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

export default function RoomLayout() {
  return (
    <div className="room-container h-screen flex flex-col bg-(--rc-bg)">
      {/* 상단 헤더: 테마 전환, 공유 링크, Git 액션, 참여/퇴장 버튼 */}
      <Header />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 사이드바: 파일 탐색기 + 음성 채팅 */}
        <div className="relative self-stretch">
          <aside className="w-64 flex flex-col bg-(--rc-sidebar-bg) transition-all duration-300 overflow-hidden h-full">
            {/* 파일 탐색기 (2/3 높이) */}
            <div className="flex-1 overflow-auto room-scrollbar">
              <FileViewer />
            </div>
            {/* 음성 채팅 참여자 목록 (1/3 높이) */}
            <div className="h-1/3 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <VoiceChat />
              </div>
            </div>
          </aside>
        </div>

        {/* 중앙: 코드 에디터 + 터미널 */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-(--rc-editor-bg)">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditorPanel />
          </div>
          <RoomTerminal />
        </main>

        {/* 오른쪽: 텍스트 채팅 패널 */}
        <TextChat />
      </div>
    </div>
  );
}
