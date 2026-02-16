/**
 * useFileLocations.ts - Yjs Awareness 기반 파일 위치 실시간 추적 훅
 *
 * [이 훅의 역할]
 * - 각 사용자가 현재 어떤 파일을 보고 있는지를 Yjs Awareness로 공유
 * - 파일 탐색기에서 각 파일 옆에 "이 파일을 보고 있는 사용자" 아바타를 표시하는 데 사용
 *
 * [Yjs + WebsocketProvider]
 * - Y.Doc: 공유 문서 객체 (여기서는 실제 문서 내용이 아닌 awareness만 사용)
 * - WebsocketProvider: Y.Doc을 WebSocket으로 다른 클라이언트와 동기화하는 제공자
 * - awareness: 커서 위치처럼 "임시 상태"를 공유하는 프로토콜
 *   → 여기서는 사용자가 보고 있는 파일 ID를 awareness에 저장
 *
 * [흐름도]
 * 사용자가 파일 선택 → updateCurrentFile(fileId) 호출
 * → awareness.setLocalStateField("user", { currentFileId: fileId })
 * → Yjs가 WebSocket으로 다른 클라이언트에 전파
 * → 다른 클라이언트의 awareness "change" 이벤트 발생
 * → updateFileLocations()에서 fileLocations 상태 갱신
 * → UI에 파일별 사용자 목록 표시
 */
import { useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import type {
  FileLocationState,
  FileViewerUser,
  FileAwarenessData,
} from "@/types/file";

const WS_BASE_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";

interface UseFileLocationsResult {
  fileLocations: FileLocationState[];
  updateCurrentFile: (fileId: number | null) => void;
}
export function useFileLocations(
  roomId: number,
  userId?: string,
  userName?: string,
  userImageUrl?: string,
): UseFileLocationsResult {
  const [fileLocations, setFileLocations] = useState<FileLocationState[]>([]);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

  /**
   * Yjs 문서 및 WebSocket Provider 초기화
   * - 방 ID 기반으로 고유한 roomName을 생성하여 같은 방 사용자끼리만 동기화
   * - cleanup에서 disconnect/destroy하여 메모리 누수 방지
   */
  useEffect(() => {
    const roomName = `${roomId}/file-locations`;
    const yDocument = new Y.Doc();
    const wsProvider = new WebsocketProvider(WS_BASE_URL, roomName, yDocument, {
      connect: true,
    });

    setAwareness(wsProvider.awareness);

    if (userId && userName) {
      wsProvider.awareness.setLocalStateField("user", {
        userId,
        userName,
        imageUrl: userImageUrl,
        currentFileId: undefined,
      } as FileAwarenessData);
    }

    return () => {
      wsProvider.disconnect();
      yDocument.destroy();
    };
  }, [roomId, userId, userName, userImageUrl]);

  /**
   * Awareness 상태 변경 구독
   * - awareness가 설정된 후에만 실행 (null 체크)
   * - getStates()로 모든 클라이언트의 상태를 조회하여 파일별 사용자 목록 생성
   * - Map을 사용하여 파일 ID별로 사용자를 그룹핑
   */
  useEffect(() => {
    if (!awareness) return;

    const updateFileLocations = () => {
      const states = awareness.getStates();
      const locationMap = new Map<number, FileViewerUser[]>();

      states.forEach((state) => {
        const userData = state.user as FileAwarenessData | undefined;
        if (!userData?.currentFileId) return;

        const fileId = userData.currentFileId;
        const user: FileViewerUser = {
          userId: userData.userId,
          userName: userData.userName,
          imageUrl: userData.imageUrl,
        };

        if (!locationMap.has(fileId)) {
          locationMap.set(fileId, []);
        }
        locationMap.get(fileId)!.push(user);
      });

      const locations: FileLocationState[] = Array.from(
        locationMap.entries(),
      ).map(([fileId, users]) => ({ fileId, users }));

      setFileLocations(locations);
    };

    awareness.on("change", updateFileLocations);
    updateFileLocations();

    return () => {
      awareness.off("change", updateFileLocations);
    };
  }, [awareness]);

  const updateCurrentFile = useCallback(
    (fileId: number | null) => {
      if (!awareness || !userId || !userName) return;

      awareness.setLocalStateField("user", {
        userId,
        userName,
        imageUrl: userImageUrl,
        currentFileId: fileId ?? undefined,
      } as FileAwarenessData);
    },
    [awareness, userId, userName, userImageUrl],
  );

  return { fileLocations, updateCurrentFile };
}

export default useFileLocations;
