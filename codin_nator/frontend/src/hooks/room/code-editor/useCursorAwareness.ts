/**
 * useCursorAwareness.ts - Yjs Awareness 기반 실시간 커서 위치 동기화 훅
 *
 * [Yjs - CRDT 기반 실시간 협업]
 * - CRDT (Conflict-free Replicated Data Type): 충돌 없는 복제 데이터 타입
 *   → 여러 사용자가 동시에 같은 문서를 편집해도 자동으로 충돌을 해결
 *   → 서버 없이도 모든 클라이언트가 최종적으로 동일한 상태에 도달 (최종 일관성)
 * - Y.Doc: 공유 문서 객체 (모든 클라이언트가 동일한 상태 유지)
 * - Y.XmlText: Slate 에디터와 연동되는 공유 텍스트 타입
 *
 * [Awareness 프로토콜이란?]
 * - Yjs의 부가 기능으로, 문서 내용이 아닌 "임시 상태"를 공유하는 프로토콜
 * - 커서 위치, 사용자 이름, 온라인 상태 등 "문서에 저장될 필요 없는" 정보를 실시간 공유
 * - 사용자가 접속을 끊으면 해당 awareness 상태는 자동으로 제거됨
 * - 비유: 문서 = 칠판에 적힌 글, Awareness = 각자가 들고 있는 마커 위치/색상
 *
 * [이 훅의 역할]
 * 1. 현재 사용자의 커서 위치를 awareness에 설정 (다른 사용자에게 브로드캐스트)
 * 2. 다른 사용자들의 커서 위치를 구독하여 React 상태로 변환
 * 3. 커서 색상을 clientID 기반으로 자동 할당
 *
 * [흐름도]
 * 내 커서 이동 → updateCursorPosition() → awareness.setLocalState()
 * → Yjs가 WebSocket으로 다른 클라이언트에 전파
 * → 다른 클라이언트의 awareness "change" 이벤트 발생
 * → handleChange()에서 remoteCursors 상태 갱신 → UI에 원격 커서 표시
 */
import { useEffect, useState, useCallback } from "react";
import type { Range } from "slate";
import type { RemoteCursor, UseCursorAwarenessParams, AwarenessState } from "@/types/editor";
import { getCursorColor } from "@/types/editor";

export function useCursorAwareness({
  provider,
  user,
}: UseCursorAwarenessParams) {
  /**
   * remoteCursors: 다른 사용자들의 커서 정보 배열
   * - UI에서 이 배열을 순회하며 각 사용자의 커서와 이름 태그를 렌더링
   */
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);

  /**
   * provider.awareness: Yjs WebSocket Provider의 Awareness 객체
   * - 모든 클라이언트 간 임시 상태 동기화를 담당
   * - clientID: 각 브라우저 탭에 할당되는 고유 ID
   */
  const awareness = provider.awareness;

  /**
   * 현재 사용자 정보를 awareness에 등록
   * - setLocalState(): 자신의 상태를 설정 → 다른 클라이언트에 자동 전파
   * - cleanup (return)에서 null로 설정 → 언마운트 시 상태 제거
   */
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

  /**
   * 커서 위치 업데이트 함수
   * - Slate 에디터의 selection이 변경될 때마다 호출
   * - awareness에 새 selection을 설정하면 자동으로 다른 클라이언트에 전파
   *
   * [useCallback이란?]
   * - 함수를 메모이제이션하여 의존성이 바뀌지 않으면 같은 참조를 유지
   * - 이 함수를 자식 컴포넌트에 props로 전달할 때 불필요한 리렌더링 방지
   */
  const updateCursorPosition = useCallback(
    (selection: Range | null | undefined) => {
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

  /**
   * 다른 사용자들의 커서 상태 구독
   * - awareness.on("change"): 어떤 클라이언트의 상태가 변경될 때마다 호출
   * - getStates(): 현재 연결된 모든 클라이언트의 awareness 상태를 Map으로 반환
   * - Map<clientId(숫자), AwarenessState> 구조
   */
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
