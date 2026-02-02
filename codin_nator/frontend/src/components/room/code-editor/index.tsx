import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms } from "slate";
import type { Descendant } from "slate";
import { useEffect, useMemo, useCallback, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact } from "slate-react";
import type { RenderElementProps } from "slate-react";
import { withYjs, withYHistory, withCursors, YjsEditor } from "@slate-yjs/core";
import { VscBeaker, VscPlay, VscGraph } from "react-icons/vsc";
import { aiService } from "@/services/ai/aiService";

interface CodeEditorProps {
  roomId: number;
  fileId: number;
  fileContent?: string;
  fileName?: string;
  onChange?: (code: string) => void;
  onTestGenerated?: (testCode: string) => void;
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
}: CodeEditorProps) {
  const roomName = useMemo(() => `${roomId}/${fileId}`, [roomId, fileId]);

  // Slate 초기값
  const initialValue: Descendant[] = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    [],
  );

  // 테스트 생성 로딩 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 코드 상태
  const [currentCode, setCurrentCode] = useState("");

  // yDocument는 컴포넌트 생명주기 동안 한 번만 생성 (roomName 변경 시 재생성하지 않음)
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

  // 연결/해제는 roomId/fileId 기준으로만
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

  // 컴포넌트 언마운트 시 yDocument 정리
  useEffect(() => {
    return () => {
      yDocument.destroy();
    };
  }, [yDocument]);

  // fileContent는 "내용만 주입"
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
      try {
        Transforms.select(editor, { path: [0, 0], offset: 0 });
      } catch (error) {
        console.debug("[CodeEditor] 커서 위치 설정 실패:", error);
      }
    });
  }, [editor, fileContent]);

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children } = props;

    return (
      <div {...attributes} className="flex code-line">
        <span
          contentEditable={false}
          className="
            line-number-gutter select-none text-[#858585] text-right pr-4
            min-w-[40px] font-mono text-sm leading-relaxed flex-shrink-0
          "
        />
        <span className="flex-1 whitespace-pre">{children}</span>
      </div>
    );
  }, []);

  // 테스트 코드 생성 핸들러
  const handleGenerateTest = async () => {
    // 파일명 검증
    if (!fileName) {
      alert("파일을 먼저 선택해주세요.");
      return;
    }

    // 코드 검증
    if (!currentCode || currentCode.trim().length === 0) {
      alert("코드가 비어있습니다.");
      return;
    }

    // Java 파일 검증
    if (!fileName.toLowerCase().endsWith(".java")) {
      alert("Java 파일만 테스트 생성이 가능합니다.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      console.log("[CodeEditor] 테스트 생성 시작");
      console.log("  - fileName:", fileName);
      console.log("  - code length:", currentCode.length);
      console.log("  - roomId:", roomId);

      // AI 서비스 호출
      const response = await aiService.generateTestCode(
        roomId,
        fileName,
        currentCode,
      );

      console.log("[CodeEditor] 테스트 생성 완료");
      console.log("  - testCode length:", response.testCode?.length);

      // 테스트 코드 검증
      if (!response.testCode) {
        throw new Error("테스트 코드가 생성되지 않았습니다.");
      }

      // 상위 컴포넌트로 테스트 코드 전달
      if (onTestGenerated) {
        onTestGenerated(response.testCode);
      }

      // 성공 알림
      alert("테스트 코드가 생성되었습니다!");
    } catch (error) {
      console.error("[CodeEditor] 테스트 생성 실패:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "테스트 생성 중 오류가 발생했습니다.";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      {/* 상단 액션 바 */}
      <div className="flex items-center gap-2 px-4 h-[35px] bg-[#1e1e1e] border-b border-[#2d2d30] flex-shrink-0">
        {/* 파일명 표시 */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[13px] text-[#cccccc]">
            {fileName || "파일을 선택하세요"}
          </span>
          {error && (
            <span className="text-[11px] text-red-400 ml-2">⚠️ {error}</span>
          )}
        </div>

        {/* AI 액션 버튼들 */}
        <div className="flex items-center gap-1">
          {/* 테스트 생성 버튼 */}
          <button
            onClick={handleGenerateTest}
            disabled={isGenerating || !fileName || !currentCode}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded
              text-[12px] font-medium
              transition-all duration-200
              ${
                isGenerating || !fileName || !currentCode
                  ? "bg-[#2d2d30] text-[#858585] cursor-not-allowed"
                  : "bg-[#0e639c] text-white hover:bg-[#1177bb] active:bg-[#0d5a8f]"
              }
            `}
            title="현재 코드에서 테스트 코드 생성"
          >
            <VscBeaker className="text-[14px]" />
            {isGenerating ? "생성 중..." : "테스트 생성"}
          </button>

          {/* 테스트 실행 버튼 (비활성화) */}
          <button
            disabled
            className="
              flex items-center gap-2 px-3 py-1.5 rounded
              bg-[#2d2d30] text-[#858585] cursor-not-allowed
              text-[12px] font-medium
            "
            title="테스트 실행 (구현 예정)"
          >
            <VscPlay className="text-[14px]" />
            테스트 실행
          </button>

          {/* AI 분석 버튼 (비활성화) */}
          <button
            disabled
            className="
              flex items-center gap-2 px-3 py-1.5 rounded
              bg-[#2d2d30] text-[#858585] cursor-not-allowed
              text-[12px] font-medium
            "
            title="AI 분석 (구현 예정)"
          >
            <VscGraph className="text-[14px]" />
            AI 분석
          </button>
        </div>
      </div>

      {/* 코드 에디터 영역 */}
      <div className="flex-1 overflow-auto text-[#d4d4d4] font-mono text-sm leading-relaxed code-editor-scroll code-editor-container">
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={(value) => {
            const text = value.map((node) => Node.string(node)).join("\n");
            setCurrentCode(text);
            if (onChange) {
              onChange(text);
            }
          }}
        >
          <Editable
            spellCheck={false}
            renderElement={renderElement}
            className="min-h-full w-max bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed py-4 px-2 focus:outline-none caret-[#aeafad] selection:bg-[#264f78]"
          />
        </Slate>
      </div>
    </div>
  );
}
