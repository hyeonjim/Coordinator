import * as Y from "yjs";
import { createEditor, Transforms } from "slate";
import { useEffect, useMemo, useCallback } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact } from "slate-react";
import type { RenderElementProps } from "slate-react";
import { withYjs, withYHistory, withCursors, YjsEditor } from "@slate-yjs/core";

export default function CodeEditor() {
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  const provider = useMemo(() => {
    // 환경에 따라 WebSocket URL 설정
    let wsUrl: string;
    
    if (import.meta.env.DEV) {
      // 개발 환경: Vite 프록시 사용
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host; // localhost:5173
      wsUrl = `${protocol}//${host}/ws/code`;
    } else {
      // 프로덕션 환경: 백엔드 직접 연결 (포트 8081)
      wsUrl = "wss://i14e205.p.ssafy.io:8081/ws/code";
    }
    
    console.log(`🔌 코드 에디터 WebSocket 연결: ${wsUrl}/1/10`);
    
    return new WebsocketProvider(wsUrl, "1/10", ydoc, {
      connect: true,
    });
  }, [ydoc]);

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
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children } = props;

    return (
      <div {...attributes} className="flex code-line">
        {/* 줄 번호 영역: CSS Counter를 사용해 표시합니다. */}
        <span
          contentEditable={false}
          className="
            line-number-gutter
            select-none
            text-[#858585]
            text-right
            pr-4
            min-w-[40px]
            font-mono
            text-sm
            leading-relaxed
            flex-shrink-0
          "
        />
        {/* 실제 텍스트 내용 */}
        <span className="flex-1 whitespace-pre-wrap">{children}</span>
      </div>
    );
  }, []);

  return (
    <div
      className="h-full w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed overflow-auto code-editor-scroll code-editor-container"
      style={{
        scrollbarWidth: "auto",
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
