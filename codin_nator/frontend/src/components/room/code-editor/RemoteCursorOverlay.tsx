import { useMemo } from "react";
import { ReactEditor } from "slate-react";
import type {
  RemoteCursorOverlayProps,
  CursorCaretProps,
} from "@/types/editor/cursor/types";
import type { BaseRange } from "slate/dist/interfaces/range";

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
    try {
      const domRange = ReactEditor.toDOMRange(
        editor,
        cursor.selection as BaseRange,
      );
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
      return null;
    }
  }, [cursor.selection, editor]);

  if (!position) return null;

  return (
    <div
      className="absolute"
      style={{ top: position.top, left: position.left }}
    >
      <div
        className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-sm transform -translate-y-full"
        style={{ backgroundColor: cursor.color ?? "#111" }}
      >
        {cursor.name}
      </div>
      <div
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
    // collapsed selection(=캐럿만 있는 경우)은 하이라이트하지 않음
    if (
      (cursor.selection as import("slate").Range).anchor &&
      (cursor.selection as import("slate").Range).focus &&
      (cursor.selection as import("slate").Range).anchor ===
        (cursor.selection as import("slate").Range).focus
    )
      return [];
    try {
      const domRange = ReactEditor.toDOMRange(
        editor,
        cursor.selection as import("slate").Range,
      );
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
