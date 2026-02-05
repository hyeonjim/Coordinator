/**
 * 원격 커서 Hook
 * - Yjs awareness에서 다른 사용자의 커서 상태를 읽어 React 상태로 변환합니다.
 * - @slate-yjs/core의 CursorEditor API와 Awareness 이벤트를 사용합니다.
 */
import { useEffect, useState } from "react";
import { CursorEditor, relativeRangeToSlateRange } from "@slate-yjs/core";
import type { Node } from "slate";
import type {
  CursorUserData,
  RemoteCursor,
  SlateYjsEditor,
  AwarenessCursorState,
} from "@/types/editor/cursor/types";
import type { Awareness } from "y-protocols/awareness";

/**
 * 원격 커서 훅
 * @param editor - Slate+Yjs 에디터 인스턴스
 * @param localUserData - 로컬 사용자 정보
 * @param includeLocal - 본인 커서를 포함할지 여부 (기본값: false)
 */
export function useRemoteCursors(
  editor: SlateYjsEditor,
  localUserData?: CursorUserData,
  includeLocal = false,
) {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    const awareness = (editor as SlateYjsEditor & { awareness?: Awareness })
      .awareness;
    if (!awareness) {
      console.warn("[useRemoteCursors] awareness not available");
      return;
    }

    const updateCursors = () => {
      // CursorEditor.cursorStates()로부터 모든 클라이언트 상태를 읽어옵니다.
      let states: Record<string, AwarenessCursorState> = {};
      try {
        states = CursorEditor.cursorStates(
          editor,
        ) as unknown as Record<string, AwarenessCursorState>;
      } catch (e) {
        console.debug("[useRemoteCursors] cursorStates failed", e);
        return;
      }

      const localClientId = awareness.clientID;
      const remote: RemoteCursor[] = [];

      for (const [clientIdStr, state] of Object.entries(states)) {
        if (!state || !state.data) continue;

        const clientId = state.clientId ?? parseInt(clientIdStr, 10);

        // 로컬 사용자 제외 (includeLocal이 true가 아닌 경우)
        if (!includeLocal && clientId === localClientId) continue;

        // awareness에 저장된 user data (CursorUserData 구조)를 사용
        const data = state.data as CursorUserData;

        let sel = null;
        if (state.relativeSelection) {
          try {
            sel = relativeRangeToSlateRange(
              editor.sharedRoot,
              editor as unknown as Node,
              state.relativeSelection,
            );
          } catch (e) {
            console.debug(
              "[useRemoteCursors] relativeRangeToSlateRange failed",
              e,
            );
          }
        }

        remote.push({
          clientId,
          userId: data.userId,
          name: data.name,
          color: data.color,
          imageUrl: data.imageUrl,
          selection: sel,
        });
      }

      setCursors(remote);
    };

    // Awareness 이벤트 구독 - 실시간 업데이트 감지
    const handleAwarenessChange = () => {
      updateCursors();
    };

    // CursorEditor 변경 이벤트
    CursorEditor.on(editor, "change", updateCursors);

    // Awareness 업데이트 이벤트
    awareness.on("change", handleAwarenessChange);

    // 초기 로드
    updateCursors();

    return () => {
      try {
        CursorEditor.off(editor, "change", updateCursors);
        awareness.off("change", handleAwarenessChange);
      } catch (e) {
        console.debug("[useRemoteCursors] cleanup failed", e);
      }
    };
  }, [editor, includeLocal]);

  return cursors;
}

export default useRemoteCursors;
