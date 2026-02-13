import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms, Text } from "slate";
import type { Descendant, NodeEntry, BaseRange } from "slate";
import React, { useEffect, useMemo, useCallback, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import { withYjs, withYHistory, YjsEditor } from "@slate-yjs/core";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";

import CodeEditorHeader from "./Header";
import AutoCompletePopup from "./AutoCompletePopup";
import RemoteCursorOverlay from "./CursorOverlay";
import { useFontSize } from "@/hooks/room/code-editor/useFontSize";
import { useAutoComplete } from "@/hooks/room/code-editor/useAutoComplete";
import { useCursorAwareness } from "@/hooks/room/code-editor/useCursorAwareness";
import { useAuthStore } from "@/stores/authStore";
import { useRoomContext } from "@/hooks/room/useRoomContext";
import axiosInstance from "@/api/axios";
import type { CodeEditorProps } from "@/types/room/editor/types";

const WS_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";
const INITIAL_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] },
];

export default function CodeEditor({
  roomId,
  fileId,
  fileName,
  onChange,
  onTestGenerated,
  onAppendTerminal,
}: CodeEditorProps) {
  const [currentCode, setCurrentCode] = useState("");

  // Yjs 협업 에디터 설정
  const yDocument = useMemo(() => new Y.Doc(), []);
  const sharedText = useMemo(
    () => yDocument.get("slate", Y.XmlText),
    [yDocument],
  );
  const metaMap = useMemo(() => yDocument.getMap<boolean>("meta"), [yDocument]);

  const provider = useMemo(
    () =>
      new WebsocketProvider(WS_URL, `${roomId}/${fileId}`, yDocument, {
        connect: true,
      }),
    [roomId, fileId, yDocument],
  );

  const editor = useMemo(
    () => withYHistory(withYjs(withReact(createEditor()), sharedText)),
    [sharedText],
  );

  // 재사용 hooks
  const {
    fontSize,
    lineNumberWidth,
    minFontSize,
    maxFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    handleFontSizeKeyDown,
  } = useFontSize(currentCode);
  const {
    autoCompleteItems,
    selectedIndex,
    popupPosition,
    handleAutoComplete,
    insertAutoComplete,
    handleAutoCompleteKeyDown,
  } = useAutoComplete(editor);

  const authUser = useAuthStore((state) => state.user);
  const cursorUser = useMemo(
    () => (authUser ? { userId: authUser.gitId, name: authUser.name } : null),
    [authUser],
  );
  const { remoteCursors, updateCursorPosition } = useCursorAwareness({
    provider,
    user: cursorUser,
  });

  // Yjs 연결 관리
  useEffect(() => {
    YjsEditor.connect(editor);
    return () => {
      YjsEditor.disconnect(editor);
      provider.disconnect();
      yDocument.destroy();
    };
  }, [editor, provider, yDocument]);

  // 초기 콘텐츠 로딩
  useEffect(() => {
    const loadContent = async (synced: boolean) => {
      if (!synced || metaMap.get("seeded")) return;

      if (sharedText.length > 0 && sharedText.toString().trim()) {
        metaMap.set("seeded", true);
        return;
      }

      try {
        const { data } = await axiosInstance.get(
          `/v1/room/${roomId}/${fileId}`,
          { responseType: "text" },
        );
        const lines = String(data ?? "").split(/\r?\n/);
        const nodes = lines.map((line) => ({
          type: "paragraph" as const,
          children: [{ text: line }],
        }));

        Editor.withoutNormalizing(editor, () => {
          for (let i = editor.children.length - 1; i >= 0; i--)
            Transforms.removeNodes(editor, { at: [i] });
          Transforms.insertNodes(editor, nodes, { at: [0] });
        });
      } catch {
        // 로드 실패시 빈 에디터
      }
      metaMap.set("seeded", true);
    };

    provider.once("sync", loadContent);
    return () => {
      provider.off("sync", loadContent);
    };
  }, [provider, roomId, fileId, metaMap, sharedText, editor]);

  // 구문 강조
  const decorate = useCallback(([node, path]: NodeEntry) => {
    if (!Text.isText(node)) return [];
    const tokens = Prism.tokenize(node.text, Prism.languages.java);
    const ranges: (BaseRange & { tokenType: string })[] = [];
    let offset = 0;

    for (const token of tokens) {
      const length =
        typeof token === "string" ? token.length : String(token.content).length;
      if (typeof token !== "string") {
        ranges.push({
          anchor: { path, offset },
          focus: { path, offset: offset + length },
          tokenType: token.type,
        });
      }
      offset += length;
    }
    return ranges;
  }, []);

  // 토큰 렌더링
  const renderLeaf = useCallback(
    ({ attributes, children, leaf }: RenderLeafProps) => (
      <span
        {...attributes}
        className={leaf.tokenType ? `token ${leaf.tokenType}` : undefined}
      >
        {children}
      </span>
    ),
    [],
  );

  // 줄 렌더링
  const renderElement = useCallback(
    ({ attributes, children, element }: RenderElementProps) => {
      const lineNumber = ReactEditor.findPath(editor, element)[0] + 1;
      return (
        <div {...attributes} className="flex items-stretch code-line">
          <span
            contentEditable={false}
            className="code-line-number shrink-0 text-right select-none text-[#858585]"
            style={{ width: lineNumberWidth, paddingRight: 8 }}
          >
            {lineNumber}
          </span>
          <span className="flex-1 min-w-0">{children}</span>
        </div>
      );
    },
    [editor, lineNumberWidth],
  );

  const handleEditorChange = useCallback(
    (value: Descendant[]) => {
      try {
        const text = value.map((n) => Node.string(n)).join("\n");
        setCurrentCode(text);
        onChange?.(text);
        updateCursorPosition(editor.selection);
        handleAutoComplete();
      } catch {
        /* 에디터 초기화 중 에러 무시 */
      }
    },
    [onChange, updateCursorPosition, editor, handleAutoComplete],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!handleFontSizeKeyDown(event)) handleAutoCompleteKeyDown(event);
    },
    [handleFontSizeKeyDown, handleAutoCompleteKeyDown],
  );

  return (
    <div className="code-editor-container h-full w-full flex flex-col">
      <CodeEditorHeader
        fileName={fileName}
        fontSizeProps={{
          fontSize,
          minFontSize,
          maxFontSize,
          onIncrease: increaseFontSize,
          onDecrease: decreaseFontSize,
          onReset: resetFontSize,
        }}
        aiActionsProps={{
          roomId,
          fileName,
          code: currentCode,
          onTestGenerated,
          onAppendTerminal,
        }}
      />

      <div
        className="flex-1 overflow-auto font-mono text-[#DCD8D8] relative"
        style={{ fontSize, lineHeight: `${fontSize * 1.5}px` }}
      >
        <Slate
          editor={editor}
          initialValue={INITIAL_VALUE}
          onChange={handleEditorChange}
        >
          <Editable
            spellCheck={false}
            decorate={decorate}
            renderLeaf={renderLeaf}
            renderElement={renderElement}
            onKeyDown={handleKeyDown}
            className="min-h-full px-2 py-4 focus:outline-none"
            style={{ lineHeight: `${fontSize * 1.5}px`, whiteSpace: "pre" }}
          />
        </Slate>

        <RemoteCursorOverlay cursors={remoteCursors} editor={editor} />
        <AutoCompletePopup
          items={autoCompleteItems}
          selectedIndex={selectedIndex}
          position={popupPosition}
          onSelect={insertAutoComplete}
        />
      </div>
    </div>
  );
}

// Context 래퍼
export function CodeEditorPanel() {
  const { selectedFile, currentRoomId, setEditorCode, appendTerminal } =
    useRoomContext();

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-[#858585]">
        파일을 선택해주세요
      </div>
    );
  }

  return (
    <CodeEditor
      key={selectedFile.id}
      fileId={selectedFile.id}
      roomId={Number(currentRoomId)}
      fileContent={selectedFile.content}
      fileName={selectedFile.name}
      onChange={setEditorCode}
      onAppendTerminal={appendTerminal}
    />
  );
}
