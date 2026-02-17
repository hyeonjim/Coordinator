/**
 * @file room.ts - 코딩 룸(Room) 핵심 타입 정의
 *
 * 실시간 협업 코딩 방의 상태, 참여자, 컨텍스트 등 핵심 타입을 정의합니다.
 * RoomContext를 통해 방 전체에서 공유되는 상태의 타입 구조입니다.
 *
 * 주요 개념:
 * - Participant: 방에 참여 중인 사용자 (WebSocket으로 실시간 동기화)
 * - SelectedFile: 현재 에디터에서 열려있는 파일
 * - RoomContextValue: React Context로 공유되는 방의 전체 상태
 * - Theme: 에디터/UI 테마 (dark, light, light2)
 *
 * 통합 출처:
 * - types/room/types.ts (그대로 이동, 주석 보강)
 */

import type { ChatMessage } from "@/types/chat";

/**
 * 방 참여자 기본 정보
 *
 * WebSocket(STOMP)을 통해 실시간으로 동기화되는 참여자 상태입니다.
 * 음성 채팅 참여 시 isSpeaking과 micOn 상태가 업데이트됩니다.
 */
export interface Participant {
  /** 사용자 고유 ID (GitHub gitId) */
  userId: string;

  /** 화면에 표시될 사용자 이름 */
  userName: string;

  /** 프로필 이미지 URL (없으면 기본 아바타 표시) */
  imageUrl?: string;

  /** 현재 발화 중 여부 (WebRTC 오디오 레벨 감지) */
  isSpeaking: boolean;

  /** 마이크 켜짐 여부 */
  micOn: boolean;
}

/**
 * 현재 에디터에서 선택(열림)된 파일 정보
 *
 * 파일 트리에서 파일을 클릭하면 이 타입의 객체가 생성되어
 * 에디터 컴포넌트에 전달됩니다.
 */
export interface SelectedFile {
  /** 파일 고유 ID (백엔드 DB 기준) */
  id: number;

  /** 파일명 (예: "Main.java") */
  name: string;

  /** 파일 내용 (에디터에 표시될 코드) */
  content: string;
}

/**
 * useRoomSetup 훅의 반환 타입
 *
 * 방 입장 시 필요한 초기 설정과 상태를 관리합니다.
 * 이 훅의 반환값은 RoomContextValue의 기반이 됩니다.
 */
export interface UseRoomSetupReturn {
  /** 현재 로그인한 사용자 ID */
  userId: string;

  /** 현재 로그인한 사용자 이름 */
  userName: string;

  /** 현재 로그인한 사용자 프로필 이미지 */
  userImageUrl?: string;

  /** WebSocket 연결 URL (STOMP 브로커) */
  webSocketUrl: string;

  /** 현재 방 ID */
  currentRoomId: string;

  /** 방 참여 완료 여부 (JOIN 메시지 전송 후 true) */
  isJoined: boolean;
  setIsJoined: React.Dispatch<React.SetStateAction<boolean>>;

  /** 현재 방 참여자 목록 */
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;

  /** 채팅 메시지 목록 */
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

  /** 현재 선택된 파일 */
  selectedFile: SelectedFile | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile | null>>;

  /** 에디터 코드 내용 */
  editorCode: string;
  setEditorCode: React.Dispatch<React.SetStateAction<string>>;

  /** 터미널 출력 내용 */
  terminalOutput: string;
  setTerminalOutput: React.Dispatch<React.SetStateAction<string>>;

  /** 사이드바 축소 여부 */
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * 에디터/UI 테마 타입
 *
 * CSS 변수(--rc-*)로 정의된 3가지 테마:
 * - "dark": 다크 테마 (기본값)
 * - "light": 라이트 테마
 * - "light2": 라이트 테마 변형
 *
 * Header.tsx에서 room-container에 클래스를 추가하여 테마를 전환합니다.
 */
export type Theme = "dark" | "light" | "light2";

/**
 * Git 관련 액션 버튼 정의
 *
 * 방 내에서 수행할 수 있는 Git 작업 (commit, push 등)의 UI 표현입니다.
 */
export interface GitAction {
  /** 액션 고유 식별자 (예: "commit", "push") */
  id: string;

  /** UI에 표시될 라벨 (예: "커밋", "푸시") */
  label: string;
}

/**
 * RoomContext 공유 값 타입
 *
 * React Context API를 통해 Room 하위의 모든 컴포넌트에서 접근 가능한 상태입니다.
 * Provider에서 이 값을 제공하고, useContext(RoomContext)로 소비합니다.
 *
 * 구조적으로 크게 6개 영역으로 나뉩니다:
 * 1. 사용자 정보 (userId, userName, ...)
 * 2. 방 상태 (isJoined, participants, chatMessages)
 * 3. 파일 선택 상태
 * 4. 에디터/터미널 상태
 * 5. 음성 채팅 제어
 * 6. 방 액션 (입장, 퇴장, 채팅 전송)
 */
export interface RoomContextValue {
  // ── 사용자 정보 ──
  userId: string;
  userName: string;
  userImageUrl?: string;
  currentRoomId: string;

  // ── 방 상태 ──
  /** 방 참여 완료 여부 */
  isJoined: boolean;
  /** 현재 참여자 목록 */
  participants: Participant[];
  /** 채팅 메시지 목록 */
  chatMessages: ChatMessage[];

  // ── 파일 선택 상태 ──
  selectedFile: SelectedFile | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile | null>>;

  // ── 에디터 / 터미널 상태 ──
  editorCode: string;
  setEditorCode: React.Dispatch<React.SetStateAction<string>>;
  terminalOutput: string;
  /** 터미널에 새 출력을 추가하는 함수 */
  appendTerminal: (title: string, text: string) => void;

  // ── UI 상태 ──
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  // ── 음성 채팅 ──
  /** WebSocket(STOMP) 연결 상태 */
  isWebSocketConnected: boolean;
  /** 마이크 토글 (on/off) */
  handleToggleMic: () => Promise<void>;
  /** 특정 피어의 오디오 음소거 토글 */
  togglePeerMute: (peerId: string) => void;
  /** 특정 피어의 음소거 상태 확인 */
  isPeerMuted: (peerId: string) => boolean;

  // ── 방 액션 ──
  /** 방 입장 처리 */
  handleJoin: () => Promise<void>;
  /** 방 퇴장 처리 */
  handleLeave: () => void;
  /** 채팅 메시지 전송 */
  handleSendChat: (text: string) => void;
}
