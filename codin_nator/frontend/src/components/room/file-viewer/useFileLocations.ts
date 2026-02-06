/**
 * 파일 위치 추적 훅
 * - Yjs awareness를 사용하여 각 사용자가 보고 있는 파일을 실시간으로 추적합니다.
 * - 사용자가 파일을 선택하면 awareness에 현재 파일 정보를 업데이트합니다.
 */
import { useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { FileLocationState, FileViewerUser } from "@/types/file/types";
import type { Awareness } from "y-protocols/awareness";

/**
 * Awareness에 저장되는 파일 위치 정보
 */
interface FileAwarenessData {
  userId: string;
  userName: string;
  imageUrl?: string;
  color?: string;
  currentFileId?: number; // 현재 보고 있는 파일 ID
}

export function useFileLocations(
  roomId: number,
  userId?: string,
  userName?: string,
  userImageUrl?: string,
  userColor?: string,
) {
  const [fileLocations, setFileLocations] = useState<FileLocationState[]>([]);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

  // Yjs provider 초기화
  useEffect(() => {
    const WS_BASE_URL =
      import.meta.env.VITE_CODE_WS_URL ?? "wss://i14e205.p.ssafy.io/ws/code";
    const roomName = `${roomId}/file-locations`;

    const yDocument = new Y.Doc();
    const wsProvider = new WebsocketProvider(WS_BASE_URL, roomName, yDocument, {
      connect: true,
    });

    setAwareness(wsProvider.awareness);

    // 로컬 사용자 정보 설정
    if (userId && userName) {
      wsProvider.awareness.setLocalStateField("user", {
        userId,
        userName,
        imageUrl: userImageUrl,
        color: userColor,
        currentFileId: undefined,
      } as FileAwarenessData);
    }

    return () => {
      wsProvider.disconnect();
      yDocument.destroy();
    };
  }, [roomId, userId, userName, userImageUrl, userColor]);

  // Awareness 변경 감지 및 파일 위치 업데이트
  useEffect(() => {
    if (!awareness) return;

    const updateFileLocations = () => {
      const states = awareness.getStates();
      const locationMap = new Map<number, FileViewerUser[]>();

      states.forEach((state) => {
        const userData = state.user as FileAwarenessData | undefined;
        if (!userData || !userData.currentFileId) return;

        const fileId = userData.currentFileId;
        const user: FileViewerUser = {
          userId: userData.userId,
          userName: userData.userName,
          imageUrl: userData.imageUrl,
          color: userData.color,
        };

        if (!locationMap.has(fileId)) {
          locationMap.set(fileId, []);
        }
        locationMap.get(fileId)!.push(user);
      });

      const locations: FileLocationState[] = Array.from(locationMap.entries()).map(
        ([fileId, users]) => ({
          fileId,
          users,
        }),
      );

      setFileLocations(locations);
    };

    awareness.on("change", updateFileLocations);
    updateFileLocations(); // 초기 로드

    return () => {
      awareness.off("change", updateFileLocations);
    };
  }, [awareness]);

  // 현재 파일 ID 업데이트 함수
  const updateCurrentFile = useCallback(
    (fileId: number | null) => {
      if (!awareness || !userId || !userName) return;

      const userData: FileAwarenessData = {
        userId,
        userName,
        imageUrl: userImageUrl,
        color: userColor,
        currentFileId: fileId ?? undefined,
      };

      awareness.setLocalStateField("user", userData);
    },
    [awareness, userId, userName, userImageUrl, userColor],
  );

  return {
    fileLocations,
    updateCurrentFile,
  };
}

export default useFileLocations;
