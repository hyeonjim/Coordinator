import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { getFileTree } from "../../../lib/utils";
import type { FileNode, LocalFileSystemFileEntry, RawNode } from "./types";
import { normalizeFileTree, sanitizeTree } from "./utils";

interface UseFileViewerProps {
  roomId: number;
  onFileSelect?: (fileId: number, content: string, fileName: string) => void;
}

/**
 * 파일 뷰어 로직 분리 (데이터 페칭, 업로드, 드래그앤드롭)
 */
export function useFileViewer({ roomId, onFileSelect }: UseFileViewerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // roomId 유효성 검사
  const roomIdSafe = useMemo(() => {
    const n = Number(roomId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [roomId]);

  // 1. 파일 목록 조회
  const fetchFileTree = useCallback(async () => {
    if (!roomIdSafe) {
      setFiles([]);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/room/${roomIdSafe}/files`);
      // 데이터 정규화 및 표준화
      const normalized = normalizeFileTree(res.data);
      // 포맷 맞추기: Backend Response -> RawNode[] -> FileNode[]
      setFiles(sanitizeTree(normalized as RawNode[]));
    } catch (e) {
      console.error("❌ 파일 목록 로드 실패:", e);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [roomIdSafe]);

  // 초기 로드
  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  // 2. 파일 선택 핸들러
  const handleSelectFile = async (node: FileNode) => {
    if (node.type !== "FILE") return;

    setSelectedId(node.fileId);
    console.group(`📌 File Selected: ${node.name}`);

    try {
      const res = await axios.get(`/api/v1/room/files/${node.fileId}`, {
        responseType: "text",
      });

      const content =
        typeof res.data === "string"
          ? res.data
          : JSON.stringify(res.data ?? "", null, 2);

      onFileSelect?.(node.fileId, content, node.name);
      console.log("✅ Content Loaded");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("❌ Load failed:", err.response?.status);
      } else {
        console.error("❌ Load failed:", err);
      }
    } finally {
      console.groupEnd();
    }
  };

  // 3. 파일 업로드 로직 (재귀)
  const uploadFileToServer = async (fileEntry: LocalFileSystemFileEntry) => {
    return new Promise<void>((resolve, reject) => {
      fileEntry.file(async (file: File) => {
        // .zip 검사
        if (!file.name.toLowerCase().endsWith(".zip")) {
          alert("현재 .zip 파일 업로드만 지원합니다.");
          reject("Not a zip file");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          if (!roomIdSafe) throw new Error("Invalid Room ID");
          await axios.post(`/api/v1/room/${roomIdSafe}/uploads`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          console.log(`✅ Uploaded: ${file.name}`);
          resolve();
        } catch (error) {
          console.error(`❌ Upload Failed:`, error);
          alert("업로드 실패");
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

  // 4. 드래그 앤 드롭 핸들러
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.items) return;

    setLoading(true);
    try {
      // 드롭된 아이템을 트리 구조로 변환 (lib/utils 활용)
      const parsedTreeRaw = await getFileTree(e.dataTransfer.items);
      // 포맷 맞추기: parsedTreeRaw는 lib/utils에서 왔으므로 RawNode와 호환된다고 가정(casting)
      const sanitizedTree = sanitizeTree(parsedTreeRaw as unknown as RawNode[]);

      await processUploadLoop(sanitizedTree);
      await fetchFileTree();
      alert("업로드가 완료되었습니다!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    files,
    loading,
    selectedId,
    handleSelectFile,
    handleDragOver,
    handleDrop,
    refreshResult: fetchFileTree,
  };
}
