import { useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import type {
  FileLocationState,
  FileViewerUser,
  FileAwarenessData,
} from "@/types/room/file/types";

const WS_BASE_URL =
  import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";

interface UseFileLocationsResult {
  fileLocations: FileLocationState[];
  updateCurrentFile: (fileId: number | null) => void;
}

/**
 * 파일 위치 추적 훅
 * Yjs awareness를 사용하여 각 사용자가 보고 있는 파일을 실시간으로 추적
 */
export function useFileLocations(
  roomId: number,
  userId?: string,
  userName?: string,
  userImageUrl?: string,
): UseFileLocationsResult {
  const [fileLocations, setFileLocations] = useState<FileLocationState[]>([]);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

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
