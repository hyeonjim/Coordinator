// 규성코드 전면수정함(리팩토링 예정)

import axios from "axios";
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
import type {
  FileNode,
  LocalFileSystemFileEntry,
  RawNode,
} from "@/types/file/types";

// Helper Functions (데이터 처리 로직)
// 임시 ID 생성을 위한 변수입니다.
let tempIdSequence = 1;

/**
 * 서버나 파일 시스템에서 받은 원본 데이터를 UI에서 사용할 수 있는 형태로 변환합니다.
 * - 파일/폴더 타입 구분
 * - ID가 없을 경우 임시 ID 발급
 * - 자식 노드 재귀 처리
 */
const sanitizeTree = (rawList: RawNode[]): FileNode[] => {
  const sanitizeNode = (rawNode: RawNode): FileNode => {
    // 타입 대문자 변환 및 정규화
    const rawType = String(
      rawNode.type ?? rawNode.nodeType ?? rawNode.kind ?? "",
    ).toUpperCase();
    const isDir = rawType === "DIR" || rawType === "FOLDER";
    const type: "DIR" | "FILE" = isDir ? "DIR" : "FILE";

    // ID 보장
    const rawId = Number(rawNode.fileId ?? rawNode.id);
    const fileId =
      Number.isFinite(rawId) && rawId > 0 ? rawId : tempIdSequence++;

    // 자식 노드 재귀 처리
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

/**
 * 다양한 API 응답 구조를 배열 형태로 통일합니다.
 */
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

// Main Component

interface FileViewerProps {
  roomId: number;
  onFileSelect?: (fileId: number, content: string, fileName: string) => void;
}

/**
 * 프로젝트 파일 탐색기 메인 컴포넌트
 * - 파일 목록 조회, 선택, 업로드(Drag & Drop) 기능을 통합하여 관리합니다.
 */
const FileViewer = ({ roomId, onFileSelect }: FileViewerProps) => {
  // 상태 관리
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // roomId가 유효한 숫자인지 확인합니다.
  const roomIdSafe = useMemo(() => {
    const numericRoomId = Number(roomId);
    return Number.isFinite(numericRoomId) && numericRoomId > 0
      ? numericRoomId
      : null;
  }, [roomId]);
  const accessToken = localStorage.getItem("access_token");
  // 1. 파일 목록 조회 함수
  const fetchFileTree = useCallback(async () => {
    if (!roomIdSafe) {
      setFiles([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/room/${roomIdSafe}/files`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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

  // 컴포넌트 마운트 시 파일 목록을 불러옵니다.
  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  // 2. 파일 선택 처리
  const handleSelectFile = async (node: FileNode) => {
    if (node.type !== "FILE") return;

    setSelectedId(node.fileId);

    try {
      // 파일 내용을 서버에서 가져옵니다.
      const response = await axios.get(
        `/api/v1/room/${roomIdSafe}/${node.fileId}`,
        {
          responseType: "text",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const content =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data ?? "", null, 2);

      // 상위 컴포넌트로 선택된 파일 정보와 내용을 전달합니다.
      onFileSelect?.(node.fileId, content, node.name);
    } catch (error) {
      console.error("파일 내용 로드 실패:", error);
    }
  };

  // 3. 파일 업로드 로직 (단일 파일)
  const uploadFileToServer = async (fileEntry: LocalFileSystemFileEntry) => {
    return new Promise<void>((resolve, reject) => {
      fileEntry.file(async (file: File) => {
        // ZIP 파일 유효성 검사
        if (!file.name.toLowerCase().endsWith(".zip")) {
          alert("현재 .zip 파일 업로드만 지원합니다.");
          reject("Not a zip file");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        const accessToken = localStorage.getItem("access_token");
        try {
          if (!roomIdSafe) throw new Error("유효하지 않은 방 ID입니다.");

          await axios.post(`/api/v1/room/${roomIdSafe}/uploads`, formData, {
            headers: { Authorization: `Bearer ${accessToken}` },
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

  // 4. 재귀적 파일 업로드 처리
  const processUploadLoop = async (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === "FILE" && node.fileEntry) {
        await uploadFileToServer(node.fileEntry);
      } else if (node.type === "DIR" && node.children) {
        await processUploadLoop(node.children);
      }
    }
  };

  // 5. 드래그 앤 드롭 핸들러
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
      // 드롭된 아이템을 트리 구조로 파싱합니다.
      const parsedTreeRaw = await getFileTree(event.dataTransfer.items);

      // 파싱된 데이터를 UI 포맷에 맞게 변환합니다.
      const sanitizedTree = sanitizeTree(parsedTreeRaw as unknown as RawNode[]);

      // 변환된 파일들을 업로드 처리합니다.
      await processUploadLoop(sanitizedTree);

      // 목록을 새로고침하고 완료 알림을 표시합니다.
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
      className="w-full h-full bg-[#252526] text-[#cccccc] flex flex-col font-sans select-none border-r border-[#1e1e1e]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 헤더 영역: 프로젝트 제목 및 액션 버튼 */}
      <div className="flex items-center justify-between px-4 h-[35px] bg-[#252526] hover:bg-[#2a2d2e] group">
        <div className="flex items-center text-[11px] font-bold text-[#bbbbbb] tracking-wide uppercase cursor-pointer">
          <span className="mr-1">
            <VscChevronDown />
          </span>
          <span>PROJECT-EXPLORER</span>
        </div>

        {/* 추가 액션 버튼들 (표시만 해둠) */}
        <div className="hidden group-hover:flex items-center gap-2 text-sm text-[#cccccc]">
          <VscNewFile
            className="hover:text-white cursor-pointer"
            title="새 파일"
          />
          <VscNewFolder
            className="hover:text-white cursor-pointer"
            title="새 폴더"
          />
          <VscRefresh
            className="hover:text-white cursor-pointer"
            title="새로고침"
            onClick={(event) => {
              event.stopPropagation();
              fetchFileTree();
            }}
          />
        </div>
      </div>

      {/* 파일 목록 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {loading ? (
          // 로딩 상태 표시
          <div className="flex justify-center items-center h-20 text-[#cccccc]">
            <VscLoading className="animate-spin text-2xl" />
          </div>
        ) : files.length === 0 ? (
          // 파일이 없을 때 안내 메시지
          <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-[#858585] opacity-50 space-y-2">
            <VscFolderOpened className="text-4xl" />
            <span className="text-sm">파일이 없습니다.</span>
            <span className="text-xs">(.zip 파일을 이곳에 드래그하세요)</span>
          </div>
        ) : (
          // 파일 트리 렌더링
          <div className="py-1">
            {files.map((node) => (
              <FileTreeItem
                key={node.fileId}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={handleSelectFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* 하단 상태바 */}
      <div className="h-[22px] bg-[#007acc] text-white text-[11px] flex items-center px-3 gap-3">
        <span>master*</span>
        {roomIdSafe && <span>Room: {roomIdSafe}</span>}
      </div>
    </div>
  );
};

export default FileViewer;
