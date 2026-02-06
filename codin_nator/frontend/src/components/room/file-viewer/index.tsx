// 규성코드 전면수정함(리팩토링 예정)

import axios from "axios";
import type { FileViewerProps } from "@/types/file/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import {
  VscChevronDown,
  VscFolderOpened,
  VscLoading,
  VscNewFile,
  VscNewFolder,
  VscRefresh,
} from "react-icons/vsc";

import { FileTreeItem } from "./FileTreeItem";
import { getFileTree } from "@/lib/utils";
import { useFileLocations } from "./useFileLocations";
import { getUserColor } from "../code-editor/colorAssignment";
import type {
  FileNode,
  LocalFileSystemFileEntry,
  RawNode,
} from "@/types/file/types";

// Helper Functions (데이터 처리 로직)
let tempIdSequence = 1;

const sanitizeTree = (rawList: RawNode[]): FileNode[] => {
  const sanitizeNode = (rawNode: RawNode): FileNode => {
    const rawType = String(
      rawNode.type ?? rawNode.nodeType ?? rawNode.kind ?? "",
    ).toUpperCase();
    const isDir = rawType === "DIR" || rawType === "FOLDER";
    const type: "DIR" | "FILE" = isDir ? "DIR" : "FILE";

    const rawId = Number(rawNode.fileId ?? rawNode.id);
    const fileId =
      Number.isFinite(rawId) && rawId > 0 ? rawId : tempIdSequence++;

    const children = Array.isArray(rawNode.children)
      ? (rawNode.children as RawNode[]).map(sanitizeNode)
      : undefined;

    return {
      fileId,
      name: String(rawNode.name ?? rawNode.fileName ?? ""),
      type,
      children,
      fileEntry: rawNode.fileEntry as LocalFileSystemFileEntry | undefined,
    };
  };

  return rawList.map(sanitizeNode);
};

const normalizeFileTree = (data: unknown): RawNode[] => {
  if (Array.isArray(data)) return data as RawNode[];

  const response = data as {
    files?: unknown[];
    data?: unknown[];
    result?: unknown[];
    fileTree?: unknown[];
  };
  return (response?.files ||
    response?.data ||
    response?.result ||
    response?.fileTree ||
    []) as RawNode[];
};

const FileViewer = ({
  roomId,
  onFileSelect,
  userId,
  userName,
  userImageUrl,
}: FileViewerProps) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const roomIdSafe = useMemo(() => {
    const numericRoomId = Number(roomId);
    return Number.isFinite(numericRoomId) && numericRoomId > 0
      ? numericRoomId
      : null;
  }, [roomId]);

  // 파일 위치 추적 (사용자 색상은 getUserColor로 계산)
  const { fileLocations, updateCurrentFile } = useFileLocations(
    roomIdSafe ?? 0,
    userId,
    userName,
    userImageUrl,
    userId ? getUserColor(userId) : undefined,
  );

  const fetchFileTree = useCallback(async () => {
    if (!roomIdSafe) {
      setFiles([]);
      return;
    }

    try {
      setLoading(true);

      // ✅ 토큰은 요청 시점에 읽기 + 없으면 헤더를 생략 (Bearer null 방지)
      const accessToken = localStorage.getItem("access_token");
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined;

      const response = await axios.get(`/api/v1/room/${roomIdSafe}/files`, {
        headers,
      });

      const normalized = normalizeFileTree(response.data);
      setFiles(sanitizeTree(normalized));
    } catch (error) {
      console.error("파일 목록 로드 실패:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [roomIdSafe]);

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  const handleSelectFile = async (node: FileNode) => {
    if (node.type !== "FILE") return;
    if (!roomIdSafe) return;

    setSelectedId(node.fileId);

    // awareness에 현재 파일 위치 업데이트
    updateCurrentFile(node.fileId);

    if (!onFileSelect) return;

    // content까지 전달
    try {
      const accessToken = localStorage.getItem("access_token");
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined;

      const response = await axios.get(
        `/api/v1/room/${roomIdSafe}/${node.fileId}`,
        {
          responseType: "text",
          headers,
        },
      );

      const content =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data ?? "", null, 2);

      onFileSelect(node.fileId, content, node.name);
    } catch (error) {
      console.error("파일 내용 로드 실패:", error);
      // content 못 가져와도 파일명은 전달
      onFileSelect(node.fileId, "", node.name);
    }
  };

  const uploadFileToServer = async (fileEntry: LocalFileSystemFileEntry) => {
    return new Promise<void>((resolve, reject) => {
      fileEntry.file(async (file: File) => {
        if (!file.name.toLowerCase().endsWith(".zip")) {
          alert("현재 .zip 파일 업로드만 지원합니다.");
          reject("Not a zip file");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          if (!roomIdSafe) throw new Error("유효하지 않은 방 ID입니다.");

          const accessToken = localStorage.getItem("access_token");
          const headers = accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined;

          await axios.post(`/api/v1/room/${roomIdSafe}/uploads`, formData, {
            headers,
          });

          resolve();
        } catch (error) {
          console.error("업로드 실패:", error);
          alert("업로드에 실패했습니다.");
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

    setLoading(true);
    try {
      const parsedTreeRaw = await getFileTree(event.dataTransfer.items);
      const sanitizedTree = sanitizeTree(parsedTreeRaw as unknown as RawNode[]);
      await processUploadLoop(sanitizedTree);

      await fetchFileTree();
      alert("파일 업로드가 완료되었습니다.");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="file-viewer-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
          />
          <VscNewFolder
            className="cursor-pointer transition-colors"
            title="새 폴더"
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

      <div className="flex-1 overflow-auto room-scrollbar relative ">
        {loading ? (
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
          <div className="py-1">
            {files.map((node) => (
              <FileTreeItem
                key={node.fileId}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={handleSelectFile}
                fileLocations={fileLocations}
              />
            ))}
          </div>
        )}
      </div>

      <div className="file-viewer-statusbar">
        <span>master*</span>
        {roomIdSafe && <span>Room: {roomIdSafe}</span>}
      </div>
    </div>
  );
};

export default FileViewer;
