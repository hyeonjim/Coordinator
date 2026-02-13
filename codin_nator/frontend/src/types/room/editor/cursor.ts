import type { Editor, Range } from "slate";
import type { ReactEditor } from "slate-react";
import type { RelativeRange } from "@slate-yjs/core";
import type { WebsocketProvider } from "y-websocket";

// 커서 색상 목록
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

export type CursorColor = (typeof CURSOR_COLORS)[number];

// clientId로 색상 선택
export function getCursorColor(clientId: number): CursorColor {
  return CURSOR_COLORS[clientId % CURSOR_COLORS.length];
}

// Yjs awareness 사용자 정보
export interface CursorUserData {
  userId: string;
  name: string;
  color?: string;
}

// 원격 커서 정보
export interface RemoteCursor {
  clientId: number;
  userId: string;
  name: string;
  color?: string;
  selection: Range | null;
}

// 오버레이 props
export interface RemoteCursorOverlayProps {
  cursors: RemoteCursor[];
  editor: Editor & ReactEditor;
}

// 커서 캐럿 props
export interface CursorCaretProps {
  cursor: RemoteCursor;
  editor: Editor & ReactEditor;
}

// useRemoteCursors 내부 커서 상태
export interface CursorState {
  data?: CursorUserData;
  relativeSelection?: RelativeRange;
  clientId?: number;
}

// useCursorAwareness hook 파라미터
export interface UseCursorAwarenessParams {
  provider: WebsocketProvider;
  user: CursorUserData | null;
}

// awareness 상태
export interface AwarenessState {
  user?: CursorUserData;
  selection?: Range | null | undefined;
}

export type { Range };
