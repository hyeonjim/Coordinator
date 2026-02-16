/**
 * @file editor.ts - 코드 에디터 관련 타입 정의
 *
 * Slate.js 기반 코드 에디터와 실시간 커서 공유 기능의 타입을 정의합니다.
 *
 * 주요 개념:
 * - AutoComplete: 코드 자동완성 (키워드, 클래스, 메서드, 스니펫)
 * - CodeEditor: 에디터 컴포넌트의 Props
 * - Cursor: Yjs awareness를 이용한 실시간 원격 커서 표시
 *
 * 통합 출처:
 * - types/room/editor/types.ts (자동완성, 에디터 Props)
 * - types/room/editor/cursor.ts (커서 색상, 원격 커서)
 */

import type { Editor, Range } from "slate";
import type { ReactEditor } from "slate-react";
import type { RelativeRange } from "@slate-yjs/core";
import type { WebsocketProvider } from "y-websocket";
import type { AiActionsProps } from "@/types/ai";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 자동완성 (AutoComplete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 자동완성 항목 하나의 구조
 *
 * 에디터에서 단어를 입력하면 매칭되는 자동완성 후보 목록이 팝업으로 표시됩니다.
 * type에 따라 아이콘이 달라집니다 (키워드, 클래스, 메서드, 스니펫).
 */
export interface AutoCompleteItem {
  /** 자동완성 목록에 표시될 텍스트 */
  label: string;

  /** 항목 종류 (아이콘 구분용) */
  type: "keyword" | "class" | "method" | "snippet";

  /** 실제 삽입될 텍스트 (label과 다를 수 있음, 예: 스니펫 템플릿) */
  insertText?: string;
}

/**
 * 현재 입력 중인 단어 정보
 *
 * 커서 위치에서 단어 경계를 파악하여 자동완성 필터링에 사용합니다.
 */
export interface WordInfo {
  /** 현재 입력 중인 단어 */
  word: string;

  /** 단어의 시작 위치 (offset) */
  start: number;
}

/**
 * 자동완성 팝업 컴포넌트 Props
 *
 * 에디터 위에 절대 위치(position)로 팝업을 표시합니다.
 */
export interface AutoCompletePopupProps {
  /** 표시할 자동완성 항목 목록 */
  items: AutoCompleteItem[];

  /** 현재 키보드로 선택된 항목 인덱스 */
  selectedIndex: number;

  /** 팝업 표시 위치 (에디터 좌표 기준 px) */
  position: { top: number; left: number };

  /** 항목 클릭 시 호출되는 콜백 */
  onSelect: (item: AutoCompleteItem) => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 코드 에디터 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * CodeEditor 컴포넌트 Props
 *
 * Yjs + Slate.js를 결합한 실시간 협업 코드 에디터의 최상위 Props입니다.
 * 방 ID와 파일 ID로 WebSocket 연결을 설정하고, 코드 변경 시 콜백을 호출합니다.
 */
export interface CodeEditorProps {
  /** 현재 방 ID (WebSocket 연결에 사용) */
  roomId: number;

  /** 편집 중인 파일 ID (Yjs document 식별자) */
  fileId: number;

  /** 파일 초기 내용 */
  fileContent?: string;

  /** 파일명 (헤더에 표시) */
  fileName?: string;

  /** 코드 변경 시 호출되는 콜백 */
  onChange?: (code: string) => void;

  /** AI 테스트 코드 생성 완료 시 호출되는 콜백 */
  onTestGenerated?: (testCode: string) => void;

  /** 터미널에 출력을 추가하는 콜백 */
  onAppendTerminal?: (title: string, text: string) => void;
}

/**
 * 폰트 크기 조절 컨트롤 Props
 *
 * 에디터 헤더에 표시되는 폰트 크기 +/- 버튼의 Props입니다.
 */
export interface FontSizeControlProps {
  /** 현재 폰트 크기 (px) */
  fontSize: number;

  /** 최소 폰트 크기 */
  minFontSize: number;

  /** 최대 폰트 크기 */
  maxFontSize: number;

  /** 크기 증가 버튼 핸들러 */
  onIncrease: () => void;

  /** 크기 감소 버튼 핸들러 */
  onDecrease: () => void;

  /** 기본 크기로 리셋 버튼 핸들러 */
  onReset: () => void;
}

/**
 * 코드 에디터 헤더 컴포넌트 Props
 *
 * 파일명, 폰트 크기 조절, AI 기능 버튼 등을 포함하는 에디터 상단 바입니다.
 */
export interface CodeEditorHeaderProps {
  /** 현재 편집 중인 파일명 */
  fileName?: string;

  /** 폰트 크기 조절 Props */
  fontSizeProps: FontSizeControlProps;

  /** AI 기능 (테스트 생성 등) Props */
  aiActionsProps: AiActionsProps;
}

/**
 * AiActionsProps를 re-export하여 에디터 관련 코드에서
 * ai/types를 직접 import하지 않아도 사용할 수 있게 합니다.
 */
export type { AiActionsProps };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 실시간 커서 (Remote Cursor)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 커서 색상 팔레트
 *
 * 각 참여자에게 고유한 색상을 부여하기 위한 색상 목록입니다.
 * clientId를 배열 길이로 나눈 나머지(modulo)를 인덱스로 사용합니다.
 * as const로 선언하여 튜플 타입으로 만들고, 리터럴 타입 추론을 가능하게 합니다.
 */
export const CURSOR_COLORS = [
  "#E91E63",
  "#2196F3",
  "#4CAF50",
  "#FF9800",
  "#9C27B0",
  "#00BCD4",
  "#F44336",
  "#3F51B5",
  "#009688",
] as const;

/**
 * 커서 색상 리터럴 타입
 *
 * CURSOR_COLORS 배열의 요소 타입입니다.
 * typeof와 인덱스 접근 타입([number])을 조합하여 유니온 리터럴 타입을 추출합니다.
 */
export type CursorColor = (typeof CURSOR_COLORS)[number];

/**
 * clientId로 커서 색상을 선택하는 유틸리티 함수
 *
 * Yjs의 awareness에서 부여하는 clientId를 기반으로
 * 색상 팔레트에서 순환적으로 색상을 선택합니다.
 *
 * @param clientId - Yjs awareness clientId (숫자)
 * @returns 해당 clientId에 대응하는 커서 색상
 */
export function getCursorColor(clientId: number): CursorColor {
  return CURSOR_COLORS[clientId % CURSOR_COLORS.length];
}

/**
 * Yjs awareness에 저장되는 사용자 커서 데이터
 *
 * 각 클라이언트가 자신의 awareness 상태에 이 데이터를 설정하면,
 * 다른 클라이언트들이 이를 읽어 원격 커서를 표시합니다.
 */
export interface CursorUserData {
  /** 사용자 고유 ID */
  userId: string;

  /** 화면에 표시될 이름 (커서 라벨) */
  name: string;

  /** 커서 색상 (미지정 시 clientId 기반 자동 할당) */
  color?: string;
}

/**
 * 원격 커서 정보 (렌더링용)
 *
 * 다른 참여자의 커서 위치와 메타 정보를 담습니다.
 * CursorOverlay 컴포넌트에서 이 데이터를 기반으로 커서 UI를 렌더링합니다.
 */
export interface RemoteCursor {
  /** Yjs awareness clientId */
  clientId: number;

  /** 사용자 고유 ID */
  userId: string;

  /** 커서 라벨에 표시될 이름 */
  name: string;

  /** 커서 색상 */
  color?: string;

  /** Slate Range 형태의 선택 영역 (null이면 커서 숨김) */
  selection: Range | null;
}

/**
 * 원격 커서 오버레이 컴포넌트 Props
 *
 * 에디터 위에 겹쳐서 표시되는 다른 참여자들의 커서를 렌더링합니다.
 */
export interface RemoteCursorOverlayProps {
  /** 표시할 원격 커서 목록 */
  cursors: RemoteCursor[];

  /** Slate 에디터 인스턴스 (커서 위치를 DOM 좌표로 변환하는 데 필요) */
  editor: Editor & ReactEditor;
}

/**
 * 커서 캐럿(커서 막대) 컴포넌트 Props
 *
 * 개별 원격 커서를 시각적으로 표시하는 컴포넌트입니다.
 * 깜빡이는 막대와 사용자 이름 라벨을 렌더링합니다.
 */
export interface CursorCaretProps {
  /** 표시할 커서 정보 */
  cursor: RemoteCursor;

  /** Slate 에디터 인스턴스 */
  editor: Editor & ReactEditor;
}

/**
 * useRemoteCursors 훅 내부의 커서 상태
 *
 * Yjs awareness에서 읽어온 원시 커서 데이터입니다.
 * RelativeRange는 Yjs 문서 기준 상대 위치로, Slate Range로 변환해야 합니다.
 */
export interface CursorState {
  /** 커서 소유자 정보 */
  data?: CursorUserData;

  /** Yjs 상대 위치 기반 선택 범위 */
  relativeSelection?: RelativeRange;

  /** Yjs awareness clientId */
  clientId?: number;
}

/**
 * useCursorAwareness 훅 파라미터
 *
 * Yjs WebsocketProvider를 통해 다른 참여자의 커서 정보를 주고받습니다.
 */
export interface UseCursorAwarenessParams {
  /** Yjs WebSocket 프로바이더 인스턴스 */
  provider: WebsocketProvider;

  /** 현재 사용자 정보 (null이면 커서 공유 비활성화) */
  user: CursorUserData | null;
}

/**
 * Yjs awareness 상태 구조
 *
 * awareness.getStates()로 읽어오는 각 클라이언트의 상태 형태입니다.
 */
export interface AwarenessState {
  /** 사용자 정보 */
  user?: CursorUserData;

  /** 현재 선택 범위 */
  selection?: Range | null | undefined;
}

/** Slate Range 타입 re-export (커서 관련 코드에서 편리하게 사용) */
export type { Range };
