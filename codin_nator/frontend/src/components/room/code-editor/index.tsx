import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms, Text } from "slate";
import type { Descendant, NodeEntry } from "slate";
import { useEffect, useMemo, useCallback, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import { withYjs, withYHistory, withCursors, YjsEditor } from "@slate-yjs/core";
import Prism from "prismjs";
import axios from "axios";

/* Prism 언어 & 테마 */
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";

// ✅ 상단 액션바 분리 컴포넌트
import Codeeditoractions from "@/components/ai/Codeeditoractions";

interface CodeEditorProps {
  roomId: number;
  fileId: number;
  fileContent?: string;
  fileName?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;

  /** ✅ 터미널 누적 출력용(선택) */
  onAppendTerminal?: (title: string, text: string) => void;
}

const WS_BASE_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";

export default function CodeEditor({
  roomId,
  fileId,
  fileContent,
  fileName,
  onChange,
  onTestGenerated,
  onAppendTerminal,
}: CodeEditorProps) {
  const roomName = useMemo(() => `${roomId}/${fileId}`, [roomId, fileId]);

  const initialValue: Descendant[] = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    [],
  );

  const [currentCode, setCurrentCode] = useState("");

  /* Yjs */
  const yDocument = useMemo(() => new Y.Doc(), []);
  const metaMap = useMemo(() => yDocument.getMap<boolean>("meta"), [yDocument]);

  const provider = useMemo(
    () =>
      new WebsocketProvider(WS_BASE_URL, roomName, yDocument, {
        connect: true,
      }),
    [roomName, yDocument],
  );

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

  /* 연결 */
  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      name: "tester",
      color: "#6366f1",
    });

    YjsEditor.connect(editor);
    return () => {
      YjsEditor.disconnect(editor);
      provider.disconnect();
    };
  }, [editor, provider]);

  useEffect(() => {
    return () => {
      yDocument.destroy();
    };
  }, [yDocument]);

  /* =========================
     Prism Highlight
     ========================= */
  const decorate = useCallback(([node, path]: NodeEntry) => {
    if (!Text.isText(node)) return [];

    const grammar = Prism.languages.java;
    const tokens = Prism.tokenize(node.text, grammar);

    let start = 0;
    const ranges: {
      anchor: { path: number[]; offset: number };
      focus: { path: number[]; offset: number };
      tokenType: string;
    }[] = [];

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

  /**
   * ✅ FIX: useSlateStatic() 같은 Hook을 render 콜백 내부에서 쓰면
   * 훅 규칙 위반으로 런타임 오류가 날 수 있음.
   * -> 바깥 editor(ReactEditor 적용된)를 클로저로 사용.
   */
  const renderElement = useCallback(
    (props: RenderElementProps) => {
      const { attributes, children, element } = props;

      const path = ReactEditor.findPath(editor as ReactEditor, element);
      const lineNumber = path[0] + 1;

      return (
        <div {...attributes} className="flex code-line">
          <span
            contentEditable={false}
            className="
              select-none text-[#858585] text-right pr-4
              min-w-[40px] font-mono text-sm leading-relaxed
            "
          >
            {lineNumber}
          </span>
          <span className="flex-1 whitespace-pre">{children}</span>
        </div>
      );
    },
    [editor],
  );

  /* =========================
     Seed Helper
     ========================= */
  const seedFromText = useCallback(
    (text: string) => {
      const lines = String(text ?? "").split(/\r?\n/);
      const nodes = (lines.length ? lines : [""]).map((line) => ({
        type: "paragraph" as const,
        children: [{ text: line }],
      }));

      Editor.withoutNormalizing(editor, () => {
        try {
          // 기존 노드들 싹 제거 (뒤에서 앞으로 제거하는게 안정적)
          for (let i = editor.children.length - 1; i >= 0; i -= 1) {
            Transforms.removeNodes(editor, { at: [i] });
          }
        } catch (e) {
          console.debug("[CodeEditor] 기존 노드 제거 중 예외:", e);
        }

        Transforms.insertNodes(editor, nodes, { at: [0] });

        // 커서 맨 위로
        try {
          Transforms.select(editor, { path: [0, 0], offset: 0 });
        } catch (e) {
          // 무시
        }
      });
    },
    [editor],
  );

  /* =========================
     ✅ 1) fileContent가 있으면 sync 기다리지 말고 즉시 시딩
     (WS 죽어도 화면에 내용 보이게)
     ========================= */
  useEffect(() => {
    if (typeof fileContent !== "string") return;

    // 이미 seeded면 중복 금지
    if (metaMap.get("seeded") === true) return;

    // 이미 yjs에 내용 있으면(다른 사람이 seed) 덮어쓰지 않음
    if (yjsSharedXmlText.length > 0) {
      metaMap.set("seeded", true);
      return;
    }

    seedFromText(fileContent);
    metaMap.set("seeded", true);
  }, [fileContent, metaMap, seedFromText, yjsSharedXmlText]);

  /* =========================
     ✅ 2) fileContent가 없을 때만: 기존 master처럼 sync 시점에 API fetch seed
     ========================= */
  useEffect(() => {
    if (typeof fileContent === "string") return; // content 있으면 위에서 처리
    if (!provider) return;

    const handleSync = async (isSynced: boolean) => {
      if (!isSynced) return;

      if (metaMap.get("seeded") === true) return;

      if (yjsSharedXmlText.length > 0) {
        metaMap.set("seeded", true);
        return;
      }

      try {
        const accessToken = localStorage.getItem("access_token");
        const headers = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined;

        const res = await axios.get(`/api/v1/room/${roomId}/${fileId}`, {
          responseType: "text",
          headers,
        });

        seedFromText(String(res.data ?? ""));
        metaMap.set("seeded", true);
      } catch (error) {
        console.error("[CodeEditor] seed(API) 실패:", error);
      }
    };

    provider.once("sync", handleSync);
    return () => provider.off("sync", handleSync);
  }, [
    provider,
    roomId,
    fileId,
    fileContent,
    metaMap,
    yjsSharedXmlText,
    seedFromText,
  ]);

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      {/* ✅ 상단 액션바: 분리된 컴포넌트 사용 */}
      <Codeeditoractions
        roomId={roomId}
        fileName={fileName}
        code={currentCode}
        onTestGenerated={onTestGenerated}
        onAppendTerminal={onAppendTerminal}
      />

      {/* 에디터 */}
      <div className="flex-1 overflow-auto font-mono text-sm text-[#d4d4d4]">
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={(value) => {
            const text = value.map((n) => Node.string(n)).join("\n");
            setCurrentCode(text);
            onChange?.(text);
          }}
        >
          <Editable
            spellCheck={false}
            decorate={decorate}
            renderLeaf={renderLeaf}
            renderElement={renderElement}
            className="min-h-full px-2 py-4 focus:outline-none caret-[#aeafad]"
          />
        </Slate>
      </div>
    </div>
  );
}
