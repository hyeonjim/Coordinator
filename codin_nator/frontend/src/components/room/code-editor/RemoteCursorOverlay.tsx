import { useMemo, useState, useEffect } from "react";
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
  const [resizeKey, setResizeKey] = useState(0);

  // 에디터 크기 변경 및 스크롤 감지
  useEffect(() => {
    try {
      const editorEl = ReactEditor.toDOMNode(editor, editor);
      if (!editorEl) return;

      // 실제 스크롤 컨테이너 찾기
      const scrollContainer = editorEl.closest('.overflow-auto') as HTMLElement;
      if (!scrollContainer) return;

      const updatePosition = () => {
        setResizeKey((prev) => prev + 1);
      };

      const resizeObserver = new ResizeObserver(updatePosition);
      // 스크롤 컨테이너와 에디터 요소 모두 관찰
      resizeObserver.observe(scrollContainer);
      resizeObserver.observe(editorEl);

      // 스크롤 시에도 위치 업데이트
      scrollContainer.addEventListener('scroll', updatePosition, { passive: true });

      // 윈도우 리사이즈 이벤트도 감지
      window.addEventListener('resize', updatePosition);

      return () => {
        resizeObserver.disconnect();
        scrollContainer.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    } catch {
      // 에디터가 마운트되지 않은 경우 무시
    }
  }, [editor]);

  const position = useMemo(() => {
    if (!cursor.selection) return null;
    try {
      const editorEl = ReactEditor.toDOMNode(editor, editor);
      if (!editorEl) return null;

      const domRange = ReactEditor.toDOMRange(
        editor,
        cursor.selection as BaseRange,
      );
      const rect = domRange.getBoundingClientRect();

      // 스크롤 컨테이너 찾기 (overlay의 부모)
      const scrollContainer = editorEl.closest('.overflow-auto') as HTMLElement;
      if (!scrollContainer) return null;

      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const scrollLeft = scrollContainer.scrollLeft;

      return {
        top: rect.top - containerRect.top + scrollTop,
        left: rect.left - containerRect.left + scrollLeft,
        height: rect.height,
      };
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.selection, editor, resizeKey]);

  if (!position) return null;

  return (
    <div
      className="absolute"
      style={{ top: position.top, left: position.left }}
    >
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

/**
 * 선택 영역 하이라이트 렌더러
 */
function SelectionHighlight({ cursor, editor }: CursorCaretProps) {
  const [resizeKey, setResizeKey] = useState(0);

  // 에디터 크기 변경 및 스크롤 감지
  useEffect(() => {
    try {
      const editorEl = ReactEditor.toDOMNode(editor, editor);
      if (!editorEl) return;

      // 실제 스크롤 컨테이너 찾기
      const scrollContainer = editorEl.closest('.overflow-auto') as HTMLElement;
      if (!scrollContainer) return;

      const updatePosition = () => {
        setResizeKey((prev) => prev + 1);
      };

      const resizeObserver = new ResizeObserver(updatePosition);
      // 스크롤 컨테이너와 에디터 요소 모두 관찰
      resizeObserver.observe(scrollContainer);
      resizeObserver.observe(editorEl);

      // 스크롤 시에도 위치 업데이트
      scrollContainer.addEventListener('scroll', updatePosition, { passive: true });

      // 윈도우 리사이즈 이벤트도 감지
      window.addEventListener('resize', updatePosition);

      return () => {
        resizeObserver.disconnect();
        scrollContainer.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    } catch {
      // 에디터가 마운트되지 않은 경우 무시
    }
  }, [editor]);

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
      const editorEl = ReactEditor.toDOMNode(editor, editor);
      if (!editorEl) return [];

      const domRange = ReactEditor.toDOMRange(
        editor,
        cursor.selection as import("slate").Range,
      );
      const clientRects = Array.from(domRange.getClientRects());

      // 스크롤 컨테이너 찾기 (overlay의 부모)
      const scrollContainer = editorEl.closest('.overflow-auto') as HTMLElement;
      if (!scrollContainer) return [];

      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const scrollLeft = scrollContainer.scrollLeft;

      return clientRects.map((rect) => ({
        top: rect.top - containerRect.top + scrollTop,
        left: rect.left - containerRect.left + scrollLeft,
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
