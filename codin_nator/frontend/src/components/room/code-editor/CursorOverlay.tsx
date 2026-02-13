import { useMemo, useState, useEffect } from "react";
import { ReactEditor } from "slate-react";
import type { RemoteCursorOverlayProps, CursorCaretProps, Range } from "@/types/room/editor/cursor";

// 에디터 크기/스크롤 변경 감지 훅
function useEditorResizeKey(editor: CursorCaretProps["editor"]) {
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    try {
      const editorElement = ReactEditor.toDOMNode(editor, editor);
      if (!editorElement) return;

      const scrollContainer = editorElement.closest(".overflow-auto") as HTMLElement;
      if (!scrollContainer) return;

      const updatePosition = () => setResizeKey((previous) => previous + 1);

      const resizeObserver = new ResizeObserver(updatePosition);
      resizeObserver.observe(scrollContainer);
      resizeObserver.observe(editorElement);

      scrollContainer.addEventListener("scroll", updatePosition, { passive: true });
      window.addEventListener("resize", updatePosition);

      return () => {
        resizeObserver.disconnect();
        scrollContainer.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    } catch {
      // 에디터 미마운트 시 무시
    }
  }, [editor]);

  return resizeKey;
}

// 원격 커서 오버레이
export default function RemoteCursorOverlay({ cursors, editor }: RemoteCursorOverlayProps) {
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

// 커서 캐럿 (이름 라벨 + 세로 막대)
function CursorCaret({ cursor, editor }: CursorCaretProps) {
  const resizeKey = useEditorResizeKey(editor);

  const position = useMemo(() => {
    if (!cursor.selection) return null;
    try {
      const editorElement = ReactEditor.toDOMNode(editor, editor);
      if (!editorElement) return null;

      const domRange = ReactEditor.toDOMRange(editor, cursor.selection as Range);
      const rect = domRange.getBoundingClientRect();

      const scrollContainer = editorElement.closest(".overflow-auto") as HTMLElement;
      if (!scrollContainer) return null;

      const containerRect = scrollContainer.getBoundingClientRect();

      return {
        top: rect.top - containerRect.top + scrollContainer.scrollTop,
        left: rect.left - containerRect.left + scrollContainer.scrollLeft,
        height: rect.height,
      };
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.selection, editor, resizeKey]);

  if (!position) return null;

  return (
    <div className="absolute" style={{ top: position.top, left: position.left }}>
      <div
        className="absolute left-0 px-1 py-1 rounded font-medium text-white whitespace-nowrap shadow-sm"
        style={{
          backgroundColor: cursor.color ?? "#111",
          fontSize: `${Math.max(10, position.height * 0.8)}px`,
          bottom: `${position.height + 4}px`,
          opacity: 0.9,
          lineHeight: "1",
          height: "fit-content",
        }}
      >
        {cursor.name}
      </div>
      <div
        style={{
          width: 2,
          height: position.height,
          backgroundColor: cursor.color ?? "#111",
        }}
      />
    </div>
  );
}

// 선택 영역 하이라이트
function SelectionHighlight({ cursor, editor }: CursorCaretProps) {
  const resizeKey = useEditorResizeKey(editor);

  const rects = useMemo(() => {
    if (!cursor.selection) return [];

    const selection = cursor.selection as Range;
    if (selection.anchor === selection.focus) return [];

    try {
      const editorElement = ReactEditor.toDOMNode(editor, editor);
      if (!editorElement) return [];

      const domRange = ReactEditor.toDOMRange(editor, selection);
      const clientRects = Array.from(domRange.getClientRects());

      const scrollContainer = editorElement.closest(".overflow-auto") as HTMLElement;
      if (!scrollContainer) return [];

      const containerRect = scrollContainer.getBoundingClientRect();

      return clientRects.map((rect) => ({
        top: rect.top - containerRect.top + scrollContainer.scrollTop,
        left: rect.left - containerRect.left + scrollContainer.scrollLeft,
        width: rect.width,
        height: rect.height,
      }));
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.selection, editor, resizeKey]);

  return (
    <>
      {rects.map((rect, index) => (
        <div
          key={index}
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
