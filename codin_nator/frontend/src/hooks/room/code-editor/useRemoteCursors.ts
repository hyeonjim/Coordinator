/**
 * 원격 커서 Hook
 * - Yjs awareness에서 다른 사용자의 커서 상태를 읽어 React 상태로 변환합니다.
 * - @slate-yjs/core의 CursorEditor API를 사용합니다.
 */
import { useEffect, useState, useRef } from "react";
import {
  CursorEditor,
  relativeRangeToSlateRange,
  type RelativeRange,
} from "@slate-yjs/core";
import type { Node } from "slate";
import type { CursorUserData, RemoteCursor } from "@/types/room/editor/cursor";

interface CursorState {
  data?: CursorUserData;
  relativeSelection?: RelativeRange;
  clientId?: number;
}

export function useRemoteCursors(
  editor: CursorEditor,
  localUserData?: CursorUserData,
  localSelection?: import("slate").Range | null,
) {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  const localSelectionRef = useRef(localSelection);
  const localUserDataRef = useRef(localUserData);

  useEffect(() => {
    localSelectionRef.current = localSelection;
    localUserDataRef.current = localUserData;
  }, [localSelection, localUserData]);

  useEffect(() => {
    const handle = () => {
      // CursorEditor.cursorStates()로부터 모든 클라이언트 상태를 읽어옵니다.
      let states: Record<string, CursorState> = {};
      try {
        states = CursorEditor.cursorStates(editor) as Record<
          string,
          CursorState
        >;
      } catch (e) {
        console.debug("[useRemoteCursors] cursorStates failed", e);
      }

      const remote: RemoteCursor[] = [];

      for (const [clientIdStr, state] of Object.entries(states)) {
        if (!state || !state.data) continue;
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
          clientId: state.clientId ?? parseInt(clientIdStr, 10),
          userId: data.userId,
          name: data.name,
          color: data.color,
          selection: sel,
        });
      }

      // 로컬 커서도 목록에 포함시켜서 본인도 오버레이로 볼 수 있게 함
      const local = localUserDataRef.current;
      const localSel = localSelectionRef.current;
      if (local && localSel) {
        remote.push({
          clientId: -1,
          userId: local.userId,
          name: local.name,
          color: local.color,
          selection: localSel,
        });
      }

      setCursors(remote);
    };

    CursorEditor.on(editor, "change", handle);
    // initial load
    handle();

    return () => {
      try {
        CursorEditor.off(editor, "change", handle);
      } catch {}
    };
  }, [editor]);

  return cursors;
}

export default useRemoteCursors;
