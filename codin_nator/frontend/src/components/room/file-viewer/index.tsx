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
import { useRoomContext } from "@/components/room";
import type { FileNode, RawNode, LocalFileSystemFileEntry } from "@/types/room/file/types";
import Alert from "@/components/common/Alert";
import axiosInstance from "@/api/axios";

let tempIdSequence = 1;

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
  const { currentRoomId, userId, userName, userImageUrl, setSelectedFile } = useRoomContext();

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
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
      const response = await axiosInstance.get(`/v1/room/${roomId}/files`);
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
      const response = await axiosInstance.get(`/v1/room/${roomId}/${node.fileId}`, {
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
      await axiosInstance.post(`/v1/room/editor/${roomId}/new-file`, {
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
      await axiosInstance.post(`/v1/room/editor/${roomId}/new-file`, {
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
        await axiosInstance.delete(`/v1/room/editor/${roomId}/delete-file/${fileId}`);
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
          await axiosInstance.post(`/v1/room/${roomId}/uploads`, formData);
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

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

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
    <div className="file-viewer-container" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="file-viewer-header group border-b border-gray-600">
        <div className="file-viewer-title">
          <span className="mr-1">
            <VscChevronDown />
          </span>
          <span>PROJECT-EXPLORER</span>
        </div>

        <div className="file-viewer-actions">
          <VscNewFile
            className="cursor-pointer transition-colors"
            title="새 파일"
            onClick={(event) => {
              event.stopPropagation();
              handleCreateFile();
            }}
          />
          <VscNewFolder
            className="cursor-pointer transition-colors"
            title="새 폴더"
            onClick={(event) => {
              event.stopPropagation();
              handleCreateFolder();
            }}
          />
          <VscRefresh
            className="cursor-pointer transition-colors"
            title="새로고침"
            onClick={(event) => {
              event.stopPropagation();
              fetchFileTree();
            }}
          />
        </div>
      </div>

      {isDeleteMode && (
        <div className="delete-mode-banner">
          <span>삭제할 파일/폴더를 선택하세요 ({deleteTargetIds.size}개 선택됨)</span>
        </div>
      )}

      <div className="flex-1 overflow-auto room-scrollbar relative">
        {isLoading ? (
          <div className="flex justify-center items-center h-20 text-[#7F838D]">
            <VscLoading className="animate-spin text-2xl" />
          </div>
        ) : files.length === 0 ? (
          <div className="file-viewer-empty">
            <VscFolderOpened className="text-4xl text-[#7F838D]" />
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

      <div className="file-viewer-statusbar flex items-center justify-between">
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
