import { useMemo } from "react";
import { ReactEditor } from "slate-react";
import type {
  RemoteCursorOverlayProps,
  CursorCaretProps,
} from "@/types/editor/cursor/types";

/**
 * 원격 커서 오버레이
 * - 각 사용자의 이름 라벨, 세로 캐럿, 선택 영역 하이라이트를 렌더링합니다.
 * - pointer-events-none 처리로 실제 편집에는 방해되지 않습니다.
 */
export default function RemoteCursorOverlay({
  cursors,
  editor,
}: RemoteCursorOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {cursors.map((cursor) => (
        <div key={cursor.clientId}>
          <SelectionHighlight cursor={cursor} editor={editor} />
          <CursorCaret cursor={cursor} editor={editor} />
        </div>
      ))}
    </div>
  );
}

/**
 * 개별 커서 캐럿 (이름 라벨 + 세로 막대)
 */
function CursorCaret({ cursor, editor }: CursorCaretProps) {
  const position = useMemo(() => {
    if (!cursor.selection) return null;

    // 에디터가 비어있는지 확인
    if (!editor.children || editor.children.length === 0) return null;

    try {
      const domRange = ReactEditor.toDOMRange(editor, cursor.selection);
      const rect = domRange.getBoundingClientRect();
      const editorEl = ReactEditor.toDOMNode(
        editor,
        editor.children[0],
      )?.parentElement;
      if (!editorEl) return null;
      const editorRect = editorEl.getBoundingClientRect();
      return {
        top: rect.top - editorRect.top,
        left: rect.left - editorRect.left,
      };
    } catch (e) {
      console.debug("[CursorCaret] Failed to calculate position", e);
      return null;
    }
  }, [cursor.selection, editor]);

  if (!position) return null;

  return (
    <div
      className="absolute transition-all duration-100"
      style={{ top: position.top, left: position.left }}
    >
      {/* 사용자 이름 라벨 */}
      <div
        className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg transform -translate-y-full"
        style={{ backgroundColor: cursor.color ?? "#111" }}
      >
        {cursor.name}
      </div>
      {/* 커서 캐럿 */}
      <div
        className="animate-pulse"
        style={{
          width: 2,
          height: 20,
          backgroundColor: cursor.color ?? "#111",
        }}
      />
    </div>
  );
}

/**
 * 선택 영역 하이라이트 렌더러
 */
function SelectionHighlight({ cursor, editor }: CursorCaretProps) {
  const rects = useMemo(() => {
    if (!cursor.selection) return [];

    // 에디터가 비어있는지 확인
    if (!editor.children || editor.children.length === 0) return [];

    const selection = cursor.selection;

    // collapsed selection(=캐럿만 있는 경우)은 하이라이트하지 않음
    if (selection.anchor && selection.focus && selection.anchor === selection.focus) {
      return [];
    }

    try {
      const domRange = ReactEditor.toDOMRange(editor, selection);
      const clientRects = Array.from(domRange.getClientRects());
      const editorEl = ReactEditor.toDOMNode(
        editor,
        editor.children[0],
      )?.parentElement;
      if (!editorEl) return [];
      const editorRect = editorEl.getBoundingClientRect();
      return clientRects.map((rect) => ({
        top: rect.top - editorRect.top,
        left: rect.left - editorRect.left,
        width: rect.width,
        height: rect.height,
      }));
    } catch (e) {
      console.debug("[SelectionHighlight] Failed to calculate rects", e);
      return [];
    }
  }, [cursor.selection, editor]);

  return (
    <>
      {rects.map((rect, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            backgroundColor: cursor.color ?? "#000",
            opacity: 0.15,
          }}
        />
      ))}
    </>
  );
}
