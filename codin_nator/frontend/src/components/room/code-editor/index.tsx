import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms, Text, Range } from "slate";
import type { Descendant, NodeEntry } from "slate";
import { useEffect, useMemo, useCallback, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import { withYjs, withYHistory, withCursors, YjsEditor } from "@slate-yjs/core";
import Prism from "prismjs";
import axios from "axios";

/* Prism */
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";

import Codeeditoractions from "@/components/ai/Codeeditoractions";
import RemoteCursorOverlay from "./RemoteCursorOverlay";
import useRemoteCursors from "./useRemoteCursors";
import { getUserColor } from "./colorAssignment";

/* 자동완성 */
import AutoCompletePopup from "./AutoCompletePopup";
import { filterAutoComplete, getCurrentWord, type AutoCompleteItem } from "./javaAutoComplete";

interface CodeEditorProps {
  roomId: number;
  fileId: number;
  fileName?: string;
  fileContent?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;
  userId?: string;
  userName?: string;
  userImageUrl?: string;
}

const WS_BASE_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";

export default function CodeEditor({
  roomId,
  fileId,
  fileName,
  onChange,
  onTestGenerated,
  onAppendTerminal,
  userId,
  userName,
  userImageUrl,
}: CodeEditorProps) {
  /* =========================
     🔑 file 단위 room
     ========================= */
  const roomName = useMemo(() => `${roomId}/${fileId}`, [roomId, fileId]);

  /* =========================
     🔑 fileId 기준 Y.Doc 분리
     ========================= */
  const yDocument = useMemo(() => new Y.Doc(), [fileId]);

  const provider = useMemo(() => {
    return new WebsocketProvider(WS_BASE_URL, roomName, yDocument, {
      connect: true,
    });
  }, [roomName, yDocument]);
  useEffect(() => {
    const handleStatus = (event: any) => {
      if (event.status === "connected") {
        console.log("WebSocket 연결됨");
      }
    };

    provider.on("status", handleStatus);
    return () => {
      provider.off("status", handleStatus);
    };
  }, [provider]);

  const yjsSharedXmlText = useMemo(
    () => yDocument.get("slate", Y.XmlText),
    [yDocument],
  );

  const editor = useMemo(() => {
    return withCursors(
      withYHistory(withYjs(withReact(createEditor()), yjsSharedXmlText)),
      provider.awareness,
    );
  }, [provider, yjsSharedXmlText]);

  const initialValue: Descendant[] = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    [],
  );

  const [currentCode, setCurrentCode] = useState("");
  const [localSelection, setLocalSelection] = useState<Range | null>(null);

  // ===========================
  // 🔤 자동완성 상태
  // ===========================
  const [autoCompleteItems, setAutoCompleteItems] = useState<AutoCompleteItem[]>([]);  // 매칭된 항목들
  const [selectedIndex, setSelectedIndex] = useState(0);  // 선택된 인덱스
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });  // 팝업 위치
  const [currentWord, setCurrentWord] = useState({ word: "", start: 0 });  // 현재 입력 중인 단어

  const localUserData =
    userId && userName
      ? {
          userId,
          name: userName,
          color: getUserColor(userId),
          imageUrl: userImageUrl,
        }
      : undefined;
  const remoteCursors = useRemoteCursors(
    editor as any,
    localUserData,
    localSelection,
  );

  /* =========================
     🔌 Yjs connect / cleanup
     ========================= */
  useEffect(() => {
    try {
      provider.awareness.setLocalStateField("user", {
        userId: userId ?? "local",
        name: userName ?? "You",
        color: userId ? getUserColor(userId) : "#6366f1",
        imageUrl: userImageUrl,
      });
    } catch (e) {
      console.debug("[CodeEditor] setLocalStateField failed", e);
    }

    YjsEditor.connect(editor);

    return () => {
      YjsEditor.disconnect(editor);
      provider.disconnect();
      yDocument.destroy();
    };
  }, [editor, provider, yDocument]);

  useEffect(() => {
    // update awareness data if user info changes
    try {
      provider.awareness.setLocalStateField("user", {
        userId: userId ?? "local",
        name: userName ?? "You",
        color: userId ? getUserColor(userId) : "#6366f1",
        imageUrl: userImageUrl,
      });
    } catch (e) {}
  }, [provider, userId, userName, userImageUrl]);

  /* =========================
     ✨ Prism Highlight
     ========================= */
  const decorate = useCallback(([node, path]: NodeEntry) => {
    if (!Text.isText(node)) return [];

    const grammar = Prism.languages.java;
    const tokens = Prism.tokenize(node.text, grammar);

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
      const path = ReactEditor.findPath(editor as ReactEditor, element);
      return (
        <div {...attributes} className="flex code-line">
          <span
            contentEditable={false}
            className="select-none text-[#858585] pr-4 min-w-[40px]"
          >
            {path[0] + 1}
          </span>
          <span className="flex-1 whitespace-pre">{children}</span>
        </div>
      );
    },
    [editor],
  );

  // ===========================
  // 🔤 자동완성: 커서 위치 계산
  // ===========================
  const updatePopupPosition = useCallback(() => {
    try {
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // 팝업을 커서 아래에 표시
      setPopupPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    } catch (e) {
      // 에러 무시
    }
  }, []);

  // ===========================
  // 🔤 자동완성: 입력 처리
  // ===========================
  const handleAutoComplete = useCallback(() => {
    // 현재 선택 영역 확인
    const { selection } = editor;
    if (!selection || !Range.isCollapsed(selection)) {
      setAutoCompleteItems([]);
      return;
    }

    // 현재 노드에서 텍스트와 커서 위치 가져오기
    const [node] = Editor.node(editor, selection.focus.path);
    if (!Text.isText(node)) {
      setAutoCompleteItems([]);
      return;
    }

    const text = node.text;
    const offset = selection.focus.offset;

    // 현재 입력 중인 단어 추출
    const wordInfo = getCurrentWord(text, offset);
    setCurrentWord(wordInfo);

    // 1글자 이상 입력되면 자동완성 표시
    if (wordInfo.word.length >= 1) {
      const items = filterAutoComplete(wordInfo.word);
      setAutoCompleteItems(items);
      setSelectedIndex(0);
      updatePopupPosition();
    } else {
      setAutoCompleteItems([]);
    }
  }, [editor, updatePopupPosition]);

  // ===========================
  // 🔤 자동완성: 항목 선택 시 삽입
  // ===========================
  const insertAutoComplete = useCallback(
    (item: AutoCompleteItem) => {
      const { selection } = editor;
      if (!selection) return;

      // 현재 단어를 선택된 항목으로 교체
      const insertText = item.insertText || item.label;

      // 현재 단어의 시작점으로 이동해서 단어 삭제
      Transforms.select(editor, {
        anchor: { path: selection.focus.path, offset: currentWord.start },
        focus: selection.focus,
      });

      // 선택된 텍스트 삭제 후 새 텍스트 삽입
      Transforms.delete(editor);
      Transforms.insertText(editor, insertText);

      // 자동완성 팝업 닫기
      setAutoCompleteItems([]);
    },
    [editor, currentWord],
  );

  // ===========================
  // 🔤 자동완성: 키보드 핸들러
  // ===========================
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // 자동완성 팝업이 열려있을 때만 처리
      if (autoCompleteItems.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          // 아래 화살표: 다음 항목 선택
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < autoCompleteItems.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          // 위 화살표: 이전 항목 선택
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : autoCompleteItems.length - 1
          );
          break;

        case "Enter":
        case "Tab":
          // Enter/Tab: 선택된 항목 삽입
          event.preventDefault();
          if (autoCompleteItems[selectedIndex]) {
            insertAutoComplete(autoCompleteItems[selectedIndex]);
          }
          break;

        case "Escape":
          // Esc: 팝업 닫기
          event.preventDefault();
          setAutoCompleteItems([]);
          break;
      }
    },
    [autoCompleteItems, selectedIndex, insertAutoComplete],
  );

  // ===========================
  // 🔤 자동완성: 팝업 닫기
  // ===========================
  const closeAutoComplete = useCallback(() => {
    setAutoCompleteItems([]);
  }, []);

  /* =========================
     🌱 Seed helper
     ========================= */
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

      // 🔒 이미 seed 했으면 종료
      if (metaMap.get("seeded")) return;

      // 🔒 이미 Yjs에 내용 있으면 seed 금지
      const hasContent =
        yjsSharedXmlText.length > 0 &&
        yjsSharedXmlText.toString().trim().length > 0;

      if (hasContent) {
        metaMap.set("seeded", true);
        return;
      }

      try {
        console.log("[CodeEditor] API seed 1회 실행", fileId);

        const token = localStorage.getItem("access_token");
        const res = await axios.get(`/api/v1/room/${roomId}/${fileId}`, {
          responseType: "text",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        seedFromText(res.data ?? "");
        metaMap.set("seeded", true);
      } catch (e) {
        console.error("[CodeEditor] seed 실패", e);
      }
    };

    provider.once("sync", handleSync);
    return () => provider.off("sync", handleSync);
  }, [provider, roomId, fileId, metaMap, seedFromText, yjsSharedXmlText]);

  /* =========================
     🖥 Render
     ========================= */
  return (
    <div className="h-full w-full flex flex-col bg-[#0A080D]">
      <Codeeditoractions
        roomId={roomId}
        fileName={fileName}
        code={currentCode}
        onTestGenerated={onTestGenerated}
        onAppendTerminal={onAppendTerminal}
      />

      <div className="flex-1 overflow-auto font-mono text-sm text-[#DCD8D8] relative">
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={(value) => {
            const text = value.map((n) => Node.string(n)).join("\n");
            setCurrentCode(text);
            onChange?.(text);
            try {
              setLocalSelection(editor.selection as Range | null);
            } catch {}

            // 🔤 자동완성 트리거
            handleAutoComplete();
          }}
        >
          <Editable
            spellCheck={false}
            decorate={decorate}
            renderLeaf={renderLeaf}
            renderElement={renderElement}
            onKeyDown={handleKeyDown}
            className="min-h-full px-2 py-4 focus:outline-none"
          />
        </Slate>
        <RemoteCursorOverlay cursors={remoteCursors} editor={editor} />

        {/* 🔤 자동완성 팝업 */}
        <AutoCompletePopup
          items={autoCompleteItems}
          selectedIndex={selectedIndex}
          position={popupPosition}
          onSelect={insertAutoComplete}
          onClose={closeAutoComplete}
        />
      </div>
    </div>
  );
}
