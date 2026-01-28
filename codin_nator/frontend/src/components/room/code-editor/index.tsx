import * as Y from "yjs";
import { createEditor, Transforms } from "slate";
import { useEffect, useMemo } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact } from "slate-react";
import { withYjs, withYHistory, withCursors, YjsEditor } from "@slate-yjs/core";

export default function CodeEditor() {
  const ydoc = useMemo(() => new Y.Doc(), []);

  const provider = useMemo(
    () =>
      new WebsocketProvider("ws://192.168.30.133:8080/ws/code/1/10", "", ydoc, {
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

  return (
    <div className="h-screen w-screen">
      <Slate editor={editor} initialValue={[]}>
        <Editable
          className="
    h-full
    w-full
    bg-[#1e1e1e]
    text-[#d4d4d4]
    font-mono
    text-sm
    leading-relaxed

    p-4
    border
    border-[#2a2a2a]

    focus:outline-none
    caret-[#aeafad]

    selection:bg-[#264f78]
  "
        />
      </Slate>
    </div>
  );
}
