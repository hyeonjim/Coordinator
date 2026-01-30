import * as Y from "yjs";
import { createEditor, Transforms } from "slate";
import { useEffect, useMemo, useCallback } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import type { RenderElementProps } from "slate-react";
import { withYjs, withYHistory, withCursors, YjsEditor } from "@slate-yjs/core";

export default function CodeEditor() {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () =>
      new WebsocketProvider("localhost", "", ydoc, {
        params: { userId: "tester" },
      }),
    [ydoc],
  );

  const yXmlText = useMemo(() => ydoc.get("slate", Y.XmlText), [ydoc]);

  const editor = useMemo(() => {
    return withCursors(
      withYHistory(withYjs(withReact(createEditor()), yXmlText)),
      provider.awareness,
    );
  }, [provider, yXmlText]);

  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      name: "tester",
      color: "#6366f1",
    });
  }, [provider]);

  useEffect(() => {
    YjsEditor.connect(editor);

    if (editor.children.length === 0) {
      Transforms.insertNodes(editor, {
        type: "paragraph",
        children: [{ text: "" }],
      });
    }

    return () => {
      YjsEditor.disconnect(editor);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [editor, provider, ydoc]);

  // 각 줄(paragraph)에 줄 번호를 표시하는 커스텀 렌더러
  const renderElement = useCallback(
    (props: RenderElementProps) => {
      const { attributes, children, element } = props;

      // Slate 에디터에서 현재 요소의 경로를 찾아 줄 번호 계산
      const path = ReactEditor.findPath(editor as ReactEditor, element);
      const lineNumber = path[0] + 1;

      return (
        <div {...attributes} className="flex">
          {/* 줄 번호 영역 */}
          <span
            contentEditable={false}
            className="
            select-none
            text-[#858585]
            text-center
            pr-2
            pl-2
            min-w-[40px]
            font-mono
            text-sm
            leading-relaxed
            flex-shrink-0
          "
          >
            {lineNumber}
          </span>
          {/* 실제 텍스트 내용 */}
          <span className="flex-1">{children}</span>
        </div>
      );
    },
    [editor],
  );

  return (
    <div
      className="h-full w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed overflow-auto code-editor-scroll"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(121, 121, 121, 0.4) transparent",
      }}
    >
      <Slate editor={editor} initialValue={[]}>
        <Editable
          renderElement={renderElement}
          className="
            min-h-full
            w-max
            bg-[#1e1e1e]
            text-[#d4d4d4]
            font-mono
            text-sm
            leading-relaxed
            py-4
            px-2
            focus:outline-none
            caret-[#aeafad]
            selection:bg-[#264f78]
          "
        />
      </Slate>
    </div>
  );
}
