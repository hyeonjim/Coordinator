/**
 * Editor Cursor 관련 타입 정의
 * - 다른 사용자의 커서/선택 영역 정보를 표현하는 타입들을 모아둡니다.
 * - @slate-yjs/core의 awareness/data 구조와 호환되도록 설계했습니다.
 */
import type { Range, BaseEditor } from "slate";
import type { ReactEditor } from "slate-react";
import type { YjsEditor, CursorEditor } from "@slate-yjs/core";

/**
 * Slate + Yjs + React + Cursor 통합 에디터 타입
 */
export type SlateYjsEditor = BaseEditor & ReactEditor & YjsEditor & CursorEditor;

/**
 * Yjs awareness에 저장되는 사용자 정보 타입
 */
export interface CursorUserData {
  userId: string; // 사용자 고유 ID
  name: string; // 표시할 사용자 이름
  color?: string; // 할당된 색상
  imageUrl?: string; // 아바타 URL
}

/**
 * Remote cursor를 렌더링하기 위한 정보
 */
export interface RemoteCursor {
  clientId: number; // Yjs client id
  userId: string; // 사용자 고유 ID
  name: string; // 표시 이름
  color?: string; // 라벨/캐럿 색상
  imageUrl?: string; // 아바타 URL
  selection: Range | null; // Slate selection (없으면 null)
}

/**
 * RemoteCursorOverlay 컴포넌트 props
 */
export interface RemoteCursorOverlayProps {
  cursors: RemoteCursor[];
  editor: SlateYjsEditor;
}

/**
 * CursorCaret 컴포넌트 props
 */
export interface CursorCaretProps {
  cursor: RemoteCursor;
  editor: SlateYjsEditor;
}

/**
 * Yjs awareness state 구조
 */
export interface AwarenessCursorState {
  clientId: number;
  data: CursorUserData;
  relativeSelection?: {
    anchor: { type: string; path: number[]; offset: number };
    focus: { type: string; path: number[]; offset: number };
  };
}

export type { Range };
