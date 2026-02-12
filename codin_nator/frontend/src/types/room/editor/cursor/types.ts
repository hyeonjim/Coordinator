import type { Editor, Range } from "slate";
import type { ReactEditor } from "slate-react";

export const CURSOR_COLORS = [
  "#E91E63", // Pink
  "#2196F3", // Blue
  "#4CAF50", // Green
  "#FF9800", // Orange
  "#9C27B0", // Purple
  "#00BCD4", // Cyan
  "#F44336", // Red
  "#3F51B5", // Indigo
  "#009688", // Teal
] as const;

export type CursorColor = (typeof CURSOR_COLORS)[number];

// clientId 기반으로 색상 할당
export function getCursorColor(clientId: number): CursorColor {
  return CURSOR_COLORS[clientId % CURSOR_COLORS.length];
}

// Yjs awareness에 저장되는 사용자 정보 타입
export interface CursorUserData {
  userId: string; // 사용자 고유 ID (git id 등)
  name: string; // 표시할 사용자 이름
  color?: string; // 할당된 색상 (옵션)
}

// Remote cursor를 렌더링하기 위한 정보
export interface RemoteCursor {
  clientId: number; // Yjs client id
  userId: string; // 사용자 고유 ID
  name: string; // 표시 이름
  color?: string; // 라벨/캐럿 색상
  selection: Range | null; // Slate selection (없으면 null)
}

// Overlay/컴포넌트 props 타입
export interface RemoteCursorOverlayProps {
  cursors: RemoteCursor[];
  editor: Editor & ReactEditor; // Slate editor (ReactEditor 적용된 인스턴스)
}

export interface CursorCaretProps {
  cursor: RemoteCursor;
  editor: Editor & ReactEditor;
}

export type { Range };
