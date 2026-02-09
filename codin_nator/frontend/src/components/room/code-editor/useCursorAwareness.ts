/**
 * Yjs Awareness 기반 커서 동기화 훅
 * - 현재 사용자의 커서 위치를 awareness에 브로드캐스트
 * - 다른 사용자들의 커서 위치를 구독하여 반환
 */
import { useEffect, useState, useCallback } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { Range } from "slate";
import type { RemoteCursor, CursorUserData } from "@/types/editor/cursor/types";
import { getCursorColor } from "@/types/editor/cursor/types";

interface UseCursorAwarenessParams {
  provider: WebsocketProvider;
  user: CursorUserData | null;
}

interface AwarenessState {
  user?: CursorUserData;
  selection?: Range | null;
}

export function useCursorAwareness({
  provider,
  user,
}: UseCursorAwarenessParams) {
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const awareness = provider.awareness;

  // 현재 사용자 정보를 awareness에 등록
  useEffect(() => {
    if (!user) return;

    const localState: AwarenessState = {
      user: {
        ...user,
        color: user.color ?? getCursorColor(awareness.clientID),
      },
      selection: null,
    };
    awareness.setLocalState(localState);

    return () => {
      awareness.setLocalState(null);
    };
  }, [awareness, user]);

  // 커서 위치 업데이트 함수
  const updateCursorPosition = useCallback(
    (selection: Range | null) => {
      if (!user) return;

      const localState = awareness.getLocalState() as AwarenessState | null;
      awareness.setLocalState({
        ...localState,
        user: localState?.user ?? {
          ...user,
          color: user.color ?? getCursorColor(awareness.clientID),
        },
        selection,
      });
    },
    [awareness, user],
  );

  // 다른 사용자들의 커서 상태 구독
  useEffect(() => {
    const handleChange = () => {
      const states = awareness.getStates() as Map<number, AwarenessState>;
      const cursors: RemoteCursor[] = [];

      states.forEach((state, clientId) => {
        if (!state.user) return;

        const cursorColor = state.user.color ?? getCursorColor(clientId);

        cursors.push({
          clientId,
          userId: state.user.userId,
          name: state.user.name,
          color: cursorColor,
          imageUrl: state.user.imageUrl,
          selection: state.selection ?? null,
        });
      });

      setRemoteCursors(cursors);
    };

    // 초기 상태 로드
    handleChange();

    awareness.on("change", handleChange);
    return () => {
      awareness.off("change", handleChange);
    };
  }, [awareness]);

  return {
    remoteCursors,
    updateCursorPosition,
    localClientId: awareness.clientID,
  };
}
