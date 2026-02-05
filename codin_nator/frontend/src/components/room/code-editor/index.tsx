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

/* Prism */
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";

import Codeeditoractions from "@/components/ai/Codeeditoractions";
import { useFileClickStore } from "@/stores/fileClick";

interface CodeEditorProps {
  roomId: number;
  fileId: number;
  fileName?: string;
  fileContent?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;
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

  /* =========================
     🔌 Yjs connect / cleanup
     ========================= */
  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      name: "tester",
      color: "#6366f1",
    });

    YjsEditor.connect(editor);

    return () => {
      YjsEditor.disconnect(editor);
      provider.disconnect();
      yDocument.destroy();
    };
  }, [editor, provider, yDocument]);

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
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      <Codeeditoractions
        roomId={roomId}
        fileName={fileName}
        code={currentCode}
        onTestGenerated={onTestGenerated}
        onAppendTerminal={onAppendTerminal}
      />

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
            className="min-h-full px-2 py-4 focus:outline-none"
          />
        </Slate>
      </div>
    </div>
  );
}
