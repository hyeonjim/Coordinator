/**
 * useRemoteCursors.ts - Slate-Yjs 기반 원격 커서 상태 추적 훅
 *
 * [이 훅의 역할]
 * - @slate-yjs/core 라이브러리의 CursorEditor API를 사용하여
 *   다른 사용자의 커서 위치를 Slate 에디터 좌표로 변환합니다.
 * - useCursorAwareness와의 차이점:
 *   → useCursorAwareness: Yjs Awareness 원시 데이터를 직접 처리
 *   → useRemoteCursors: @slate-yjs/core가 제공하는 상위 추상화 API 사용
 *
 * [relativeRange vs absoluteRange]
 * - Yjs에서 커서 위치는 "상대적 위치(relative position)"로 저장됨
 *   → 문서가 동시에 편집되어도 위치가 자동으로 조정됨
 * - relativeRangeToSlateRange()로 Slate가 이해하는 절대 위치로 변환
 *
 * [CursorEditor]
 * - @slate-yjs/core가 제공하는 커서 전용 에디터 인터페이스
 * - cursorStates(): 모든 원격 커서의 상태(사용자 정보 + 상대적 위치)를 반환
 * - "change" 이벤트: 커서 상태가 변경될 때 발생
 *
 * [useRef를 사용한 최신 값 참조]
 * - localSelection과 localUserData는 자주 변경되지만,
 *   useEffect를 재실행할 필요 없이 ref로 최신 값만 참조하면 됨
 */
import { useEffect, useState, useRef } from "react";
import {
  CursorEditor,
  relativeRangeToSlateRange,
} from "@slate-yjs/core";
import type { Node } from "slate";
import type { CursorUserData, RemoteCursor, CursorState } from "@/types/editor";

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

  /**
   * CursorEditor의 "change" 이벤트를 구독하여 원격 커서 목록을 갱신합니다.
   * - editor가 변경될 때만 useEffect가 재실행됨 (의존성: [editor])
   * - cleanup에서 이벤트 리스너를 해제하여 메모리 누수 방지
   */
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
