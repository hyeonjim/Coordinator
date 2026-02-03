import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms, Text } from "slate";
import type { Descendant } from "slate";
import type { NodeEntry } from "slate";
import { useEffect, useMemo, useCallback, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact } from "slate-react";
import { useSlateStatic, ReactEditor } from "slate-react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import { withYjs, withYHistory, withCursors, YjsEditor } from "@slate-yjs/core";
import { VscBeaker, VscPlay, VscGraph } from "react-icons/vsc";
import { aiService } from "@/services/ai/aiService";
import Prism from "prismjs";

/* Prism 언어 & 테마 */
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";

interface CodeEditorProps {
  roomId: number;
  fileId: number;
  fileContent?: string;
  fileName?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;
}

const WS_BASE_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "ws://localhost:8080/ws/code";

export default function CodeEditor({
  roomId,
  fileId,
  fileContent,
  fileName,
  onChange,
  onTestGenerated,
}: CodeEditorProps) {
  const roomName = useMemo(() => `${roomId}/${fileId}`, [roomId, fileId]);

  const initialValue: Descendant[] = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    [],
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState("");

  /* Yjs */
  const yDocument = useMemo(() => new Y.Doc(), []);
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

  /* 파일 내용 주입 */
  useEffect(() => {
    if (fileContent === undefined) return;

    const lines = String(fileContent).split(/\r?\n/);
    const nodes = (lines.length ? lines : [""]).map((line) => ({
      type: "paragraph" as const,
      children: [{ text: line }],
    }));

    Editor.withoutNormalizing(editor, () => {
      while (editor.children.length > 0) {
        Transforms.removeNodes(editor, { at: [0] });
      }
      Transforms.insertNodes(editor, nodes, { at: [0] });
    });
  }, [editor, fileContent]);

  /* =========================
     Prism Highlight 핵심
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

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    const editor = useSlateStatic();

    // 현재 줄의 path 구하기
    const path = ReactEditor.findPath(editor, element);
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
  }, []);

  /* 테스트 생성 */
  const handleGenerateTest = async () => {
    if (!fileName || !currentCode.trim()) return;
    if (!fileName.endsWith(".java")) {
      alert("Java 파일만 가능합니다.");
      return;
    }

    try {
      setIsGenerating(true);

      const response = await aiService.generateTestCode(
        roomId,
        fileName,
        currentCode,
      );

      if (!response.testCode) {
        throw new Error("테스트 코드 생성 실패");
      }

      onTestGenerated?.(response.testCode);
      alert("테스트 코드 생성 완료!");
    } catch (e: any) {
      alert(e.message ?? "오류 발생");
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      {/* 상단 바 */}
      <div className="flex items-center px-4 h-[35px] border-b border-[#2d2d30]">
        <span className="text-sm text-[#ccc] flex-1">
          {fileName ?? "파일을 선택하세요"}
        </span>

        <button
          onClick={handleGenerateTest}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0e639c] text-white text-xs rounded"
        >
          <VscBeaker />
          {isGenerating ? "생성 중..." : "테스트 생성"}
        </button>

        <button disabled className="ml-2 text-xs text-gray-500">
          <VscPlay /> 실행
        </button>
        <button disabled className="ml-2 text-xs text-gray-500">
          <VscGraph /> 분석
        </button>
      </div>

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
