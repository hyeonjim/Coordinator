import { useRoomContext } from "@/hooks/room/useRoomContext";
import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms, Text } from "slate";
import type { Descendant, NodeEntry } from "slate";
import { useEffect, useMemo, useCallback, useState } from "react";
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
import axiosInstance from "@/api/axios";
import type { CodeEditorProps } from "@/types/room/editor/types";

const WS_BASE_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";

export default function CodeEditor({
  roomId,
  fileId,
  fileName,
  onChange,
  onTestGenerated,
  onAppendTerminal,
}: CodeEditorProps) {
  const roomName = useMemo(() => `${roomId}/${fileId}`, [roomId, fileId]);

  const yDocument = useMemo(() => new Y.Doc(), [fileId]);

  const provider = useMemo(() => {
    return new WebsocketProvider(WS_BASE_URL, roomName, yDocument, {
      connect: true,
    });
  }, [roomName, yDocument]);

  const yjsSharedXmlText = useMemo(
    () => yDocument.get("slate", Y.XmlText),
    [yDocument],
  );

  const editor = useMemo(() => {
    return withYHistory(withYjs(withReact(createEditor()), yjsSharedXmlText));
  }, [provider, yjsSharedXmlText]);

  const initialValue: Descendant[] = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    [],
  );

  const [currentCode, setCurrentCode] = useState("");

  // 폰트 크기 관련 상태와 핸들러
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

  // 현재 사용자 정보
  const authUser = useAuthStore((state) => state.user);
  const cursorUser = useMemo(
    () => (authUser ? { userId: authUser.gitId, name: authUser.name } : null),
    [authUser],
  );

  // 원격 커서 동기화
  const { remoteCursors, updateCursorPosition } = useCursorAwareness({
    provider,
    user: cursorUser,
  });

  // 자동완성 관련 상태와 핸들러
  const {
    autoCompleteItems,
    selectedIndex,
    popupPosition,
    handleAutoComplete,
    insertAutoComplete,
    handleAutoCompleteKeyDown,
  } = useAutoComplete(editor);

  /* Yjs 연결 및 해제 */
  useEffect(() => {
    YjsEditor.connect(editor);

    return () => {
      YjsEditor.disconnect(editor);
      provider.disconnect();
      yDocument.destroy();
    };
  }, [editor, provider, yDocument]);

  /* Prism 구문 강조 */
  const decorate = useCallback(([node, path]: NodeEntry) => {
    if (!node || !Text.isText(node)) return [];

    const grammar = Prism.languages.java;
    const tokens = Prism.tokenize(node.text ?? "", grammar);

    let start = 0;
    const ranges: any[] = [];

    for (const token of tokens) {
      const length =
        typeof token === "string" ? token.length : String(token.content).length;

      if (typeof token !== "string") {
        ranges.push({
          anchor: { path, offset: start },
          focus: { path, offset: start + length },
          tokenType: token.type,
        });
      }
      start += length;
    }
    return ranges;
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    return (
      <span
        {...attributes}
        className={leaf.tokenType ? `token ${leaf.tokenType}` : undefined}
      >
        {children}
      </span>
    );
  }, []);

  const renderElement = useCallback(
    (props: RenderElementProps) => {
      const { attributes, children, element } = props;
      const path = ReactEditor.findPath(editor, element);
      const lineNumber = path[0] + 1;
      return (
        <div {...attributes} className="flex items-stretch code-line">
          <span
            contentEditable={false}
            className="code-line-number shrink-0 text-right select-none text-[#858585] flex items-start justify-end"
            style={{
              width: `${lineNumberWidth}px`,
              paddingRight: "8px",
              userSelect: "none",
              whiteSpace: "normal",
            }}
          >
            {lineNumber}
          </span>
          <span className="flex-1 min-w-0">{children}</span>
        </div>
      );
    },
    [editor, lineNumberWidth],
  );

  // 키보드 이벤트: 폰트 크기 조정 → 자동완성 순서로 처리
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (handleFontSizeKeyDown(event)) return;
      handleAutoCompleteKeyDown(event);
    },
    [handleFontSizeKeyDown, handleAutoCompleteKeyDown],
  );

  /* 초기 콘텐츠 로딩 */
  const seedFromText = useCallback(
    (text: string) => {
      const lines = String(text ?? "").split(/\r?\n/);
      const nodes = (lines.length ? lines : [""]).map((line) => ({
        type: "paragraph" as const,
        children: [{ text: line }],
      }));

      Editor.withoutNormalizing(editor, () => {
        for (let i = editor.children.length - 1; i >= 0; i--) {
          Transforms.removeNodes(editor, { at: [i] });
        }
        Transforms.insertNodes(editor, nodes, { at: [0] });
      });
    },
    [editor],
  );

  const metaMap = useMemo(() => yDocument.getMap<boolean>("meta"), [yDocument]);

  useEffect(() => {
    const handleSync = async (synced: boolean) => {
      if (!synced) return;
      if (metaMap.get("seeded")) return;

      const hasContent =
        yjsSharedXmlText.length > 0 &&
        yjsSharedXmlText.toString().trim().length > 0;

      if (hasContent) {
        metaMap.set("seeded", true);
        return;
      }

      try {
        console.log("[CodeEditor] API seed 1회 실행", fileId);

        const response = await axiosInstance.get(
          `/v1/room/${roomId}/${fileId}`,
          {
            responseType: "text",
          },
        );

        seedFromText(response.data ?? "");
        metaMap.set("seeded", true);
      } catch (error) {
        console.error("[CodeEditor] seed 실패, 빈 에디터로 초기화", error);
        seedFromText("");
        metaMap.set("seeded", true);
      }
    };

    provider.once("sync", handleSync);
    return () => provider.off("sync", handleSync);
  }, [provider, roomId, fileId, metaMap, seedFromText, yjsSharedXmlText]);

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
        style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px` }}
      >
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={(value) => {
            try {
              const text = value.map((node) => Node.string(node)).join("\n");
              setCurrentCode(text);
              onChange?.(text);

              // 원격 커서 위치 업데이트
              updateCursorPosition(editor.selection);

              // 자동완성 트리거
              handleAutoComplete();
            } catch {
              // 에디터 초기화 중 에러 무시
            }
          }}
        >
          <Editable
            spellCheck={false}
            decorate={decorate}
            renderLeaf={renderLeaf}
            renderElement={renderElement}
            onKeyDown={handleKeyDown}
            className="min-h-full px-2 py-4 focus:outline-none"
            style={{
              lineHeight: `${fontSize * 1.5}px`,
              whiteSpace: "pre",
              overflowWrap: "normal",
              wordBreak: "normal",
            }}
          />
        </Slate>

        {/* 원격 커서 오버레이 */}
        <RemoteCursorOverlay cursors={remoteCursors} editor={editor} />

        {/* 자동완성 팝업 */}
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
