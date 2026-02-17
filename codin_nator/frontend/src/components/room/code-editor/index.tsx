/**
 * CodeEditor - Slate + Yjs 기반 실시간 협업 코드 에디터
 *
 * [Slate 에디터 구조]
 * - Slate: 커스터마이징 가능한 리치 텍스트 에디터 프레임워크
 * - Editor: 에디터 인스턴스 (문서 조작 API 제공)
 * - Value: 문서 데이터 (Descendant[] 배열 형태)
 * - Plugins: withReact, withYjs, withYHistory로 기능을 확장 (플러그인 패턴)
 *   → withReact(createEditor())처럼 함수를 감싸서 기능을 추가하는 패턴
 *
 * [Yjs 협업 편집 흐름]
 * 1. Y.Doc 생성 → 공유 문서 객체 (모든 사용자가 동일한 문서를 참조)
 * 2. WebsocketProvider로 서버에 연결 → 문서 변경사항 실시간 동기화
 * 3. withYjs(editor, sharedText)로 Slate와 Yjs 연결
 * 4. 한 사용자의 편집 → Yjs가 변경 감지 → WebSocket으로 전파 → 다른 사용자에 반영
 *
 * [PrismJS 구문 강조]
 * - decorate 함수에서 코드를 토큰으로 분석하여 각 토큰에 색상 적용
 * - Prism.tokenize()로 Java 코드를 파싱 → 키워드, 문자열 등 토큰 식별
 *
 * [React 기초 - useMemo / useCallback]
 * - useMemo: 계산 비용이 큰 값을 메모이제이션 (의존성이 바뀔 때만 재계산)
 * - useCallback: 함수를 메모이제이션 (불필요한 리렌더링 방지)
 * - 둘 다 성능 최적화를 위한 훅
 *
 * [사용된 기술]
 * - Slate (리치 텍스트 에디터), Yjs (CRDT 기반 실시간 동기화)
 * - PrismJS (구문 강조), WebSocket (실시간 통신)
 */
import * as Y from "yjs";
import { createEditor, Editor, Node, Transforms, Text } from "slate";
import type { Descendant, NodeEntry, BaseRange } from "slate";
import React, { useEffect, useMemo, useCallback, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Slate, Editable, withReact } from "slate-react";
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
import axiosInstance from "@/services/api/axios";
import { ROOM_ENDPOINTS } from "@/services/api/endpoints";
import type { CodeEditorProps } from "@/types/editor";

// WebSocket 서버 URL (환경변수 또는 기본값)
const WS_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";
// Slate 에디터 초기값: 빈 문단 하나로 시작
const INITIAL_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] },
];

export default function CodeEditor({
  roomId, // 현재 룸 ID
  fileId, // 편집 중인 파일 ID
  fileName, // 파일 이름 (헤더에 표시)
  onChange, // 코드 변경 시 부모에게 알리는 콜백
  onTestGenerated, // AI 테스트 생성 완료 콜백
  onAppendTerminal, // 터미널에 메시지 추가 콜백
}: CodeEditorProps) {
  const [currentCode, setCurrentCode] = useState("");

  // ── Yjs 협업 에디터 설정 ──
  // useMemo: 의존성이 바뀌지 않으면 이전에 생성한 객체를 재사용 (성능 최적화)
  // Y.Doc: Yjs의 공유 문서 객체. 모든 협업 사용자가 이 문서를 공유한다
  const yDocument = useMemo(() => new Y.Doc(), []);
  // sharedText: Yjs 문서에서 "slate"라는 이름의 공유 텍스트 영역
  const sharedText = useMemo(
    () => yDocument.get("slate", Y.XmlText),
    [yDocument],
  );
  // metaMap: 문서 메타데이터 (초기 콘텐츠 로딩 여부 등)
  const metaMap = useMemo(() => yDocument.getMap<boolean>("meta"), [yDocument]);

  // WebsocketProvider: Yjs 문서를 WebSocket 서버에 연결하여 실시간 동기화
  // roomId/fileId 조합으로 고유한 채널을 생성
  const provider = useMemo(
    () =>
      new WebsocketProvider(WS_URL, `${roomId}/${fileId}`, yDocument, {
        connect: true,
      }),
    [roomId, fileId, yDocument],
  );

  // 에디터 생성: 플러그인을 중첩 적용 (안쪽부터 바깥쪽으로)
  // createEditor() → withReact(React 바인딩) → withYjs(Yjs 동기화) → withYHistory(실행취소)
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

  // useEffect - Yjs 연결 관리
  // 컴포넌트가 마운트되면 연결, 언마운트(cleanup)되면 연결 해제
  // return 함수는 "클린업 함수"로, 컴포넌트가 사라질 때 실행됨
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
          ROOM_ENDPOINTS.FILE_CONTENT(roomId, fileId),
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

  // 구문 강조 (PrismJS)
  // useCallback: 이 함수를 메모이제이션하여 매 렌더링마다 새로 만들지 않음
  // decorate는 Slate의 텍스트 노드마다 호출되어 토큰별 스타일 범위(range)를 반환
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

  // 토큰(Leaf) 렌더링: Slate에서 텍스트 노드의 최소 단위를 "leaf"라 부름
  // tokenType이 있으면 PrismJS의 CSS 클래스를 적용하여 구문 강조 색상 부여
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

  // 줄(Element) 렌더링: 각 문단(paragraph)을 줄 번호 + 코드 내용으로 표시
  // CSS counter(line-number)로 줄 번호를 자동 생성
  const renderElement = useCallback(
    ({ attributes, children }: RenderElementProps) => {
      return (
        <div {...attributes} className="flex items-stretch code-line">
          <span
            contentEditable={false}
            className="line-number-gutter shrink-0 text-right select-none"
            style={{ width: lineNumberWidth, paddingRight: 8, color: "var(--rc-code-line-num)" }}
          />
          <span className="flex-1 min-w-0">{children}</span>
        </div>
      );
    },
    [lineNumberWidth],
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
        className="flex-1 overflow-auto font-mono relative"
        style={{ fontSize, lineHeight: `${fontSize * 1.5}px`, color: "var(--rc-code-text)" }}
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

/**
 * CodeEditorPanel - Context 래퍼 컴포넌트
 *
 * [React 기초 - 조건부 렌더링]
 * - 파일이 선택되지 않았으면 안내 메시지를, 선택되었으면 CodeEditor를 렌더링
 * - key={selectedFile.id}: key가 바뀌면 React가 컴포넌트를 완전히 새로 생성
 *   → 파일이 바뀔 때 에디터를 초기화하기 위한 패턴
 */
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
