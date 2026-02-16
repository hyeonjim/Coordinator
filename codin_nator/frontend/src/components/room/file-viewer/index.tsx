/**
 * FileViewer - 파일 탐색기 (파일 트리 + 생성/삭제 + 드래그&드롭 업로드)
 *
 * [React 기초 - useCallback]
 * - useCallback: 함수를 메모이제이션하여 불필요한 재생성 방지
 * - 특히 자식 컴포넌트에 콜백을 전달할 때 유용 (불필요한 리렌더링 방지)
 *
 * [React 기초 - useEffect]
 * - fetchFileTree를 컴포넌트 마운트 시 호출하여 파일 목록 로드
 * - 의존성 배열 [fetchFileTree]로 roomId가 바뀔 때 자동 재호출
 *
 * [React 기초 - 이벤트 핸들링]
 * - onDragOver, onDrop: HTML5 드래그&드롭 API 이벤트
 * - event.preventDefault(): 기본 동작(파일 열기) 방지
 * - event.stopPropagation(): 이벤트 버블링 방지
 *
 * [사용된 기술]
 * - react-icons/vsc: VS Code 스타일 아이콘
 * - DataTransferItemList: 드래그된 파일/폴더 접근
 * - webkitGetAsEntry: 파일 시스템 엔트리 API (폴더 구조 읽기)
 * - axiosInstance: 서버 API 호출 (파일 목록, 생성, 삭제, 업로드)
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import {
  VscChevronDown,
  VscFolderOpened,
  VscLoading,
  VscNewFile,
  VscNewFolder,
  VscRefresh,
  VscTrash,
  VscCheck,
  VscClose,
} from "react-icons/vsc";
import { FileTreeItem } from "./FileTreeItem";
import { getFileTree } from "./utils";
import { useFileLocations } from "@/hooks/room/file/useFileLocations";
import { useRoomContext } from "@/hooks/room/useRoomContext";
import type { FileNode, RawNode, LocalFileSystemFileEntry } from "@/types/file";
import Alert from "@/components/common/Alert";
import axiosInstance from "@/services/api/axios";
import { ROOM_ENDPOINTS, EDITOR_ENDPOINTS } from "@/services/api/endpoints";

// 모듈 레벨 변수: 임시 ID 생성용 시퀀스 (서버 ID가 없는 노드에 부여)
let tempIdSequence = 1;

// sanitizeTree: 서버에서 받은 원시 데이터를 앱 내부 FileNode 형태로 정규화
// 재귀 함수: 폴더의 children도 동일한 변환을 적용 (트리 구조 탐색)
function sanitizeTree(rawList: RawNode[]): FileNode[] {
  const sanitizeNode = (rawNode: RawNode): FileNode => {
    const rawType = String(rawNode.type ?? rawNode.nodeType ?? rawNode.kind ?? "").toUpperCase();
    const isDirectory = rawType === "DIR" || rawType === "FOLDER";
    const type = isDirectory ? "DIR" : "FILE";

    const rawId = Number(rawNode.fileId ?? rawNode.id);
    const fileId = Number.isFinite(rawId) && rawId > 0 ? rawId : tempIdSequence++;

    return {
      fileId,
      name: String(rawNode.name ?? rawNode.fileName ?? ""),
      type,
      children: rawNode.children?.map(sanitizeNode),
      fileEntry: rawNode.fileEntry as LocalFileSystemFileEntry | undefined,
    };
  };

  return rawList.map(sanitizeNode);
}

function normalizeFileTree(data: unknown): RawNode[] {
  if (Array.isArray(data)) return data as RawNode[];

  const response = data as Record<string, unknown>;
  return (response?.files ?? response?.data ?? response?.result ?? response?.fileTree ?? []) as RawNode[];
}

export function FileViewer() {
  // useRoomContext에서 필요한 상태와 함수를 구조분해할당으로 추출
  const { currentRoomId, userId, userName, userImageUrl, setSelectedFile } = useRoomContext();

  // 여러 개의 useState: 각각 독립적인 상태를 관리
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // 알림 메시지
  const [files, setFiles] = useState<FileNode[]>([]); // 파일 트리 데이터
  const [selectedId, setSelectedId] = useState<number | null>(null); // 선택된 파일 ID
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const [isDeleteMode, setIsDeleteMode] = useState(false); // 삭제 모드 활성화 여부
  // Set<number>: 삭제 대상 파일 ID 집합 (중복 없는 자료구조)
  const [deleteTargetIds, setDeleteTargetIds] = useState<Set<number>>(new Set());

  const roomId = useMemo(() => {
    const numericRoomId = Number(currentRoomId);
    return Number.isFinite(numericRoomId) && numericRoomId > 0 ? numericRoomId : null;
  }, [currentRoomId]);

  const { fileLocations, updateCurrentFile } = useFileLocations(
    roomId ?? 0,
    userId,
    userName,
    userImageUrl,
  );

  const fetchFileTree = useCallback(async () => {
    if (!roomId) {
      setFiles([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(ROOM_ENDPOINTS.FILES(roomId));
      setFiles(sanitizeTree(normalizeFileTree(response.data)));
    } catch (error) {
      console.error("파일 목록 로드 실패:", error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  const handleSelectFile = async (node: FileNode) => {
    if (node.type !== "FILE" || !roomId) return;

    setSelectedId(node.fileId);
    updateCurrentFile(node.fileId);

    try {
      const response = await axiosInstance.get(ROOM_ENDPOINTS.FILE_CONTENT(roomId, node.fileId), {
        responseType: "text",
      });

      const content =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data ?? "", null, 2);

      setSelectedFile({ id: node.fileId, content, name: node.name });
    } catch (error) {
      console.error("파일 내용 로드 실패:", error);
      setSelectedFile({ id: node.fileId, content: "", name: node.name });
    }
  };

  const handleCreateFile = async () => {
    if (!roomId) return;

    const fileName = prompt("새 파일 이름을 입력하세요:");
    if (!fileName) return;

    try {
      await axiosInstance.post(EDITOR_ENDPOINTS.NEW_FILE(roomId), {
        fileName,
        type: "FILE",
        parentId: null,
        content: "",
      });
      await fetchFileTree();
      setAlertMessage("파일이 생성되었습니다.");
    } catch (error) {
      console.error("파일 생성 실패:", error);
      setAlertMessage("파일 생성에 실패했습니다.");
    }
  };

  const handleCreateFolder = async () => {
    if (!roomId) return;

    const folderName = prompt("새 폴더 이름을 입력하세요:");
    if (!folderName) return;

    try {
      await axiosInstance.post(EDITOR_ENDPOINTS.NEW_FILE(roomId), {
        fileName: folderName,
        type: "DIR",
        parentId: null,
        content: "",
      });
      await fetchFileTree();
      setAlertMessage("폴더가 생성되었습니다.");
    } catch (error) {
      console.error("폴더 생성 실패:", error);
      setAlertMessage("폴더 생성에 실패했습니다.");
    }
  };

  const handleToggleDeleteMode = () => {
    if (isDeleteMode) {
      setDeleteTargetIds(new Set());
    }
    setIsDeleteMode(!isDeleteMode);
  };

  const handleToggleDeleteTarget = (fileId: number) => {
    setDeleteTargetIds((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleConfirmDelete = async () => {
    if (!roomId || deleteTargetIds.size === 0) {
      setAlertMessage("삭제할 파일 또는 폴더를 선택해주세요.");
      return;
    }

    const targetCount = deleteTargetIds.size;
    if (!window.confirm(`선택한 ${targetCount}개의 항목을 삭제하시겠습니까?`)) return;

    try {
      for (const fileId of deleteTargetIds) {
        await axiosInstance.delete(EDITOR_ENDPOINTS.DELETE_FILE(roomId, fileId));
      }

      setDeleteTargetIds(new Set());
      setIsDeleteMode(false);
      setSelectedId(null);
      await fetchFileTree();
      setAlertMessage(`${targetCount}개의 항목이 삭제되었습니다.`);
    } catch (error) {
      console.error("파일 삭제 실패:", error);
      setAlertMessage("일부 파일 삭제에 실패했습니다.");
    }
  };

  const handleCancelDeleteMode = () => {
    setDeleteTargetIds(new Set());
    setIsDeleteMode(false);
  };

  const uploadFileToServer = async (fileEntry: LocalFileSystemFileEntry) => {
    return new Promise<void>((resolve, reject) => {
      fileEntry.file(async (file: File) => {
        if (!file.name.toLowerCase().endsWith(".zip")) {
          setAlertMessage("현재 .zip 파일 업로드만 지원합니다.");
          reject("Not a zip file");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          if (!roomId) throw new Error("유효하지 않은 방 ID입니다.");
          await axiosInstance.post(ROOM_ENDPOINTS.UPLOAD(roomId), formData);
          resolve();
        } catch (error) {
          console.error("업로드 실패:", error);
          setAlertMessage("업로드에 실패했습니다.");
          reject(error);
        }
      });
    });
  };

  const processUploadLoop = async (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === "FILE" && node.fileEntry) {
        await uploadFileToServer(node.fileEntry);
      } else if (node.type === "DIR" && node.children) {
        await processUploadLoop(node.children);
      }
    }
  };

  // 드래그&드롭 이벤트 핸들러
  // DragEvent<HTMLDivElement>: React의 제네릭 이벤트 타입
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // 기본 동작(파일 열기) 방지 → 드롭 가능하게 만듦
    event.stopPropagation();
  };

  // 파일 드롭 시: 파일 트리 파싱 → 업로드 → 새로고침
  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer.items) return;

    setIsLoading(true);
    try {
      const parsedTree = await getFileTree(event.dataTransfer.items);
      const sanitizedTree = sanitizeTree(parsedTree as unknown as RawNode[]);
      await processUploadLoop(sanitizedTree);
      await fetchFileTree();
      setAlertMessage("파일 업로드가 완료되었습니다.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col font-sans select-none bg-(--rc-fv-bg) text-(--rc-fv-text)"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-3 h-8 bg-(--rc-fv-header-bg) border-b border-(--rc-fv-header-border) hover:bg-(--rc-fv-header-hover) group">
        <div className="flex items-center text-[11px] font-semibold tracking-widest uppercase cursor-pointer text-(--rc-fv-title)">
          <span className="mr-1">
            <VscChevronDown />
          </span>
          <span>PROJECT-EXPLORER</span>
        </div>

        <div className="flex items-center gap-2 text-[16px] text-(--rc-fv-actions)">
          <VscNewFile
            className="cursor-pointer transition-colors hover:text-(--rc-fv-actions-hover)"
            title="새 파일"
            onClick={(event) => {
              event.stopPropagation();
              handleCreateFile();
            }}
          />
          <VscNewFolder
            className="cursor-pointer transition-colors hover:text-(--rc-fv-actions-hover)"
            title="새 폴더"
            onClick={(event) => {
              event.stopPropagation();
              handleCreateFolder();
            }}
          />
          <VscRefresh
            className="cursor-pointer transition-colors hover:text-(--rc-fv-actions-hover)"
            title="새로고침"
            onClick={(event) => {
              event.stopPropagation();
              fetchFileTree();
            }}
          />
        </div>
      </div>

      {isDeleteMode && (
        <div className="px-3 py-2 text-xs font-semibold text-center bg-(--rc-del-banner-bg) text-(--rc-del-banner-text)">
          <span>삭제할 파일/폴더를 선택하세요 ({deleteTargetIds.size}개 선택됨)</span>
        </div>
      )}

      <div className="flex-1 overflow-auto room-scrollbar relative">
        {isLoading ? (
          <div className="flex justify-center items-center h-20 text-(--rc-text-muted)">
            <VscLoading className="animate-spin text-2xl" />
          </div>
        ) : files.length === 0 ? (
          <div className="h-full min-h-37.5 flex flex-col items-center justify-center space-y-2 text-(--rc-text-muted) opacity-70">
            <VscFolderOpened className="text-4xl" />
            <span className="text-sm">파일이 없습니다.</span>
            <span className="text-xs">(.zip 파일을 이곳에 드래그하세요)</span>
          </div>
        ) : (
          <div className="py-1 inline-block min-w-full">
            {files.map((node) => (
              <FileTreeItem
                key={node.fileId}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={isDeleteMode ? undefined : handleSelectFile}
                fileLocations={fileLocations}
                isDeleteMode={isDeleteMode}
                deleteTargetIds={deleteTargetIds}
                onToggleDeleteTarget={handleToggleDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-5.25 flex items-center px-2 gap-2 justify-between bg-(--rc-statusbar-bg) text-(--rc-statusbar-text)">
        <div className="flex items-center gap-2 text-[11px]">
          <span>master*</span>
          {roomId && <span>Room: {roomId}</span>}
        </div>

        {isDeleteMode ? (
          <div className="flex items-center gap-2 text-[18px]">
            <VscCheck
              className="cursor-pointer transition-colors text-green-300 hover:text-green-300 text-lg"
              title="삭제 확인"
              onClick={(event) => {
                event.stopPropagation();
                handleConfirmDelete();
              }}
            />
            <VscClose
              className="cursor-pointer transition-colors text-red-300 hover:text-red-300 text-lg"
              title="삭제 취소"
              onClick={(event) => {
                event.stopPropagation();
                handleCancelDeleteMode();
              }}
            />
          </div>
        ) : (
          <VscTrash
            className="cursor-pointer transition-colors hover:text-red-400"
            title="삭제 모드"
            onClick={(event) => {
              event.stopPropagation();
              handleToggleDeleteMode();
            }}
          />
        )}
      </div>

      <Alert open={!!alertMessage} onConfirm={() => setAlertMessage(null)}>
        {alertMessage}
      </Alert>
    </div>
  );
}

export default FileViewer;
