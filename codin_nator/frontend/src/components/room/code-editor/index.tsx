import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms, Text, Range } from "slate";
import type { Descendant, NodeEntry } from "slate";
import { useEffect, useMemo, useCallback, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import { withYjs, withYHistory, YjsEditor } from "@slate-yjs/core";

/* Prism */
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";

import Codeeditoractions from "@/components/ai/Codeeditoractions";

/* 자동완성 */
import AutoCompletePopup, {
  filterAutoComplete,
  getCurrentWord,
} from "./AutoCompletePopup";
import type { AutoCompleteItem } from "@/types/room/editor/javaAutoComplete";

/* 커서 오버레이 */
import RemoteCursorOverlay from "./RemoteCursorOverlay";
import { useCursorAwareness } from "./useCursorAwareness";
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
  /* 🔑 file 단위 room */
  const roomName = useMemo(() => `${roomId}/${fileId}`, [roomId, fileId]);

  /* 🔑 fileId 기준 Y.Doc 분리 */
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
    return withYHistory(withYjs(withReact(createEditor()), yjsSharedXmlText));
  }, [provider, yjsSharedXmlText]);

  const initialValue: Descendant[] = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    [],
  );

  const [currentCode, setCurrentCode] = useState("");

  // 📏 폰트 크기 조정
  const [fontSize, setFontSize] = useState(16); // 기본 폰트 크기 16px

  // 📏 줄번호 너비 (자릿수에 따라 동적 계산)
  const lineNumberWidth = useMemo(() => {
    const digits = Math.max(String(currentCode.split("\n").length).length, 2);
    return digits * fontSize * 0.65 + 16;
  }, [currentCode, fontSize]);
  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 24;

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 2, MAX_FONT_SIZE));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 2, MIN_FONT_SIZE));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize(16);
  }, []);

  // 👤 현재 사용자 정보
  const authUser = useAuthStore((state) => state.user);
  const cursorUser = useMemo(
    () =>
      authUser
        ? {
            userId: authUser.gitId,
            name: authUser.name,
          }
        : null,
    [authUser],
  );

  // 🎯 커서 동기화
  const { remoteCursors, updateCursorPosition } = useCursorAwareness({
    provider,
    user: cursorUser,
  });

  // 🔤 자동완성 상태
  const [autoCompleteItems, setAutoCompleteItems] = useState<
    AutoCompleteItem[]
  >([]); // 매칭된 항목들
  const [selectedIndex, setSelectedIndex] = useState(0); // 선택된 인덱스
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 }); // 팝업 위치
  const [currentWord, setCurrentWord] = useState({ word: "", start: 0 }); // 현재 입력 중인 단어

  /* =========================
     🔌 Yjs connect / cleanup
     ========================= */
  useEffect(() => {
    YjsEditor.connect(editor);

    return () => {
      YjsEditor.disconnect(editor);
      provider.disconnect();
      yDocument.destroy();
    };
  }, [editor, provider, yDocument]);

  /* ✨ Prism Highlight */
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

  // 🔤 자동완성: 커서 위치 계산
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

  // 🔤 자동완성: 입력 처리
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

  // 🔤 자동완성: 항목 선택 시 삽입
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

  // 🔤 자동완성 + 폰트 크기 조정 키보드 핸들러
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // 📏 폰트 크기 조정 단축키 (Ctrl/Cmd + +/-/0)
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "=" || event.key === "+") {
          // Ctrl/Cmd + +: 폰트 크기 증가
          event.preventDefault();
          increaseFontSize();
          return;
        }
        if (event.key === "-" || event.key === "_") {
          // Ctrl/Cmd + -: 폰트 크기 감소
          event.preventDefault();
          decreaseFontSize();
          return;
        }
        if (event.key === "0") {
          // Ctrl/Cmd + 0: 폰트 크기 초기화
          event.preventDefault();
          resetFontSize();
          return;
        }
      }

      // 자동완성 팝업이 열려있을 때만 처리
      if (autoCompleteItems.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          // 아래 화살표: 다음 항목 선택
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < autoCompleteItems.length - 1 ? prev + 1 : 0,
          );
          break;

        case "ArrowUp":
          // 위 화살표: 이전 항목 선택
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : autoCompleteItems.length - 1,
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
    [
      autoCompleteItems,
      selectedIndex,
      insertAutoComplete,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
    ],
  );

  // 🔤 자동완성: 팝업 닫기
  const closeAutoComplete = useCallback(() => {
    setAutoCompleteItems([]);
  }, []);

  /* 🌱 Seed helper */
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

        const res = await axiosInstance.get(`/v1/room/${roomId}/${fileId}`, {
          responseType: "text",
        });

        seedFromText(res.data ?? "");
        metaMap.set("seeded", true);
      } catch (e) {
        console.error("[CodeEditor] seed 실패, 빈 에디터로 초기화", e);
        // 새로 생성된 파일이거나 API 실패 시 빈 에디터로 초기화
        seedFromText("");
        metaMap.set("seeded", true);
      }
    };

    provider.once("sync", handleSync);
    return () => provider.off("sync", handleSync);
  }, [provider, roomId, fileId, metaMap, seedFromText, yjsSharedXmlText]);

  /* 🖥 Render */
  return (
    <div className="code-editor-container h-full w-full flex flex-col">
      <Codeeditoractions
        roomId={roomId}
        fileName={fileName}
        code={currentCode}
        onTestGenerated={onTestGenerated}
        onAppendTerminal={onAppendTerminal}
        fontSize={fontSize}
        onIncreaseFontSize={increaseFontSize}
        onDecreaseFontSize={decreaseFontSize}
        onResetFontSize={resetFontSize}
        minFontSize={MIN_FONT_SIZE}
        maxFontSize={MAX_FONT_SIZE}
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
              const text = value.map((n) => Node.string(n)).join("\n");
              setCurrentCode(text);
              onChange?.(text);

              // 🎯 커서 위치 업데이트
              updateCursorPosition(editor.selection);

              // 🔤 자동완성 트리거
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

        {/* 🎯 원격 커서 오버레이 */}
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
