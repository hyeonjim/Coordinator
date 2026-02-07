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
  VscTrash,
  VscCheck,    // 삭제 확인 버튼용 아이콘
  VscClose,    // 삭제 취소 버튼용 아이콘
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
import Alert from "@/components/common/Alert";

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
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // ===== 삭제 모드 관련 상태 =====
  // 삭제 모드 활성화 여부
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  // 삭제할 파일/폴더 ID 목록 (다중 선택 지원)
  const [deleteTargetIds, setDeleteTargetIds] = useState<Set<number>>(new Set());

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

  const handleCreateFile = async () => {
    if (!roomIdSafe) return;

    const fileName = prompt("새 파일 이름을 입력하세요:");
    if (!fileName) return;

    try {
      const accessToken = localStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      await axios.post(
        `/api/v1/room/editor/${roomIdSafe}/new-file`,
        {
          fileName,
          type: "FILE",
          parentId: null,
          content: "",
        },
        { headers }
      );

      await fetchFileTree();
      setAlertMsg("파일이 생성되었습니다.");
    } catch (error) {
      console.error("파일 생성 실패:", error);
      setAlertMsg("파일 생성에 실패했습니다.");
    }
  };

  const handleCreateFolder = async () => {
    if (!roomIdSafe) return;

    const fileName = prompt("새 폴더 이름을 입력하세요:");
    if (!fileName) return;

    try {
      const accessToken = localStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      await axios.post(
        `/api/v1/room/editor/${roomIdSafe}/new-file`,
        {
          fileName,
          type: "DIR",
          parentId: null,
          content: "",
        },
        { headers }
      );

      await fetchFileTree();
      setAlertMsg("폴더가 생성되었습니다.");
    } catch (error) {
      console.error("폴더 생성 실패:", error);
      setAlertMsg("폴더 생성에 실패했습니다.");
    }
  };

  /**
   * 삭제 모드 토글
   * - 삭제 버튼 클릭 시 삭제 모드 진입/해제
   */
  const handleToggleDeleteMode = () => {
    if (isDeleteMode) {
      // 삭제 모드 해제 시 선택 초기화
      setDeleteTargetIds(new Set());
    }
    setIsDeleteMode(!isDeleteMode);
  };

  /**
   * 삭제 대상 파일/폴더 토글 선택
   * - 삭제 모드에서 파일/폴더 클릭 시 선택/해제
   */
  const handleToggleDeleteTarget = (fileId: number) => {
    setDeleteTargetIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  /**
   * 선택된 파일/폴더 일괄 삭제 실행
   */
  const handleConfirmDelete = async () => {
    if (!roomIdSafe || deleteTargetIds.size === 0) {
      setAlertMsg("삭제할 파일 또는 폴더를 선택해주세요.");
      return;
    }

    const targetCount = deleteTargetIds.size;
    const confirmed = window.confirm(
      `선택한 ${targetCount}개의 항목을 삭제하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      const accessToken = localStorage.getItem("access_token");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // 선택된 모든 파일/폴더 삭제 (순차 처리)
      for (const fileId of deleteTargetIds) {
        await axios.delete(
          `/api/v1/room/editor/${roomIdSafe}/delete-file/${fileId}`,
          { headers }
        );
      }

      // 상태 초기화
      setDeleteTargetIds(new Set());
      setIsDeleteMode(false);
      setSelectedId(null);
      await fetchFileTree();
      setAlertMsg(`${targetCount}개의 항목이 삭제되었습니다.`);
    } catch (error) {
      console.error("파일 삭제 실패:", error);
      setAlertMsg("일부 파일 삭제에 실패했습니다.");
    }
  };

  /**
   * 삭제 모드 취소
   */
  const handleCancelDeleteMode = () => {
    setDeleteTargetIds(new Set());
    setIsDeleteMode(false);
  };

  const uploadFileToServer = async (fileEntry: LocalFileSystemFileEntry) => {
    return new Promise<void>((resolve, reject) => {
      fileEntry.file(async (file: File) => {
        if (!file.name.toLowerCase().endsWith(".zip")) {
          setAlertMsg("현재 .zip 파일 업로드만 지원합니다.");
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
          setAlertMsg("업로드에 실패했습니다.");
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
      setAlertMsg("파일 업로드가 완료되었습니다.");
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

      {/* ===== 삭제 모드 안내 배너 ===== */}
      {isDeleteMode && (
        <div className="delete-mode-banner">
          <span>삭제할 파일/폴더를 선택하세요 ({deleteTargetIds.size}개 선택됨)</span>
        </div>
      )}

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
          <div className="py-1 inline-block min-w-full">
            {files.map((node) => (
              <FileTreeItem
                key={node.fileId}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={isDeleteMode ? undefined : handleSelectFile}
                fileLocations={fileLocations}
                // ===== 삭제 모드 관련 props =====
                isDeleteMode={isDeleteMode}
                deleteTargetIds={deleteTargetIds}
                onToggleDeleteTarget={handleToggleDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== 하단 상태바 (삭제 모드에 따라 UI 변경) ===== */}
      <div className="file-viewer-statusbar flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>master*</span>
          {roomIdSafe && <span>Room: {roomIdSafe}</span>}
        </div>

        {isDeleteMode ? (
          // 삭제 모드: 확인/취소 버튼 표시
          <div className="flex items-center gap-2">
            <VscCheck
              className="cursor-pointer transition-colors text-green-500 hover:text-green-400 text-lg"
              title="삭제 확인"
              onClick={(event) => {
                event.stopPropagation();
                handleConfirmDelete();
              }}
            />
            <VscClose
              className="cursor-pointer transition-colors text-red-500 hover:text-red-400 text-lg"
              title="삭제 취소"
              onClick={(event) => {
                event.stopPropagation();
                handleCancelDeleteMode();
              }}
            />
          </div>
        ) : (
          // 일반 모드: 삭제 버튼 표시
          <VscTrash
            className="cursor-pointer transition-colors hover:text-red-500"
            title="삭제 모드 (파일/폴더 선택 삭제)"
            onClick={(event) => {
              event.stopPropagation();
              handleToggleDeleteMode();
            }}
          />
        )}
      </div>
      <Alert open={!!alertMsg} onConfirm={() => setAlertMsg(null)}>
        {alertMsg}
      </Alert>
    </div>
  );
};

export default FileViewer;
