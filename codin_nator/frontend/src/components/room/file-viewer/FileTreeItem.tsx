import { useState } from "react";
import type { MouseEvent } from "react";
import { FaJava } from "react-icons/fa";
import {
  VscChevronDown,
  VscChevronRight,
  VscFile,
  VscFolder,
  VscFolderOpened,
  VscCheck, // 삭제 모드 체크 아이콘
} from "react-icons/vsc";
import type {
  FileNode,
  FileTreeItemProps as FileTreeItemPropsType,
} from "@/types/file/types";

// 파일 확장자에 맞는 아이콘을 반환하는 헬퍼 함수입니다.
// 별도의 유틸 파일로 분리하지 않고 직관적으로 찾을 수 있도록 여기에 배치했습니다.
const getFileIcon = (filename: string) => {
  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith(".java")) return <FaJava className="text-[#e76f00]" />;
  // 기본 파일 아이콘
  return <VscFile className="text-gray-400" />;
};

// 개별 파일 또는 폴더를 렌더링하는 컴포넌트입니다.
// 폴더일 경우 재귀적으로 자기 자신을 호출하여 하위 항목을 표시합니다.
export const FileTreeItem = ({
  node,
  depth,
  selectedId,
  onSelect,
  fileLocations,
  // ===== 삭제 모드 관련 props =====
  isDeleteMode = false,
  deleteTargetIds, // 삭제 대상 Set (하위 노드에도 전달)
  onToggleDeleteTarget,
}: FileTreeItemPropsType) => {
  // 현재 노드가 삭제 대상인지 확인
  const isDeleteTarget = deleteTargetIds?.has(node.fileId) ?? false;
  // 폴더의 열림/닫힘 상태를 관리합니다.
  const [isOpen, setIsOpen] = useState(false);

  // 현재 노드의 fileId로 사용자 위치 정보를 찾습니다.
  const usersOnFile =
    fileLocations.find((loc) => loc.fileId === node.fileId)?.users || [];

  // 깊이(depth)에 따라 왼쪽 여백을 계산하여 계층 구조를 시각적으로 표현합니다.
  const paddingLeft = depth * 12 + 10;

  // 현재 노드가 선택된 파일인지 확인합니다.
  const isSelected = selectedId === node.fileId && node.type === "FILE";

  // 클릭 이벤트 핸들러입니다.
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // 이벤트 버블링을 방지합니다.

    // ===== 삭제 모드일 때의 동작 =====
    if (isDeleteMode) {
      // 삭제 모드에서는 클릭 시 삭제 대상으로 선택/해제
      onToggleDeleteTarget?.(node.fileId);
      return;
    }

    // ===== 일반 모드일 때의 동작 =====
    if (node.type === "DIR") {
      // 폴더이면 열림/닫힘 상태를 토글합니다.
      setIsOpen(!isOpen);
    } else {
      // 파일이면 선택 이벤트를 상위로 전달합니다.
      onSelect?.(node);
    }
  };

  return (
    <div>
      {/* 파일/폴더 한 줄을 렌더링하는 영역 */}
      <div
        onClick={handleClick}
        className={`file-tree-item group ${isSelected ? "file-tree-item-selected" : ""} ${
          isDeleteMode ? "delete-mode-item" : ""
        } ${isDeleteTarget ? "delete-target-item" : ""}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* ===== 삭제 모드: 체크박스 표시 ===== */}
        {isDeleteMode && (
          <span className="delete-checkbox mr-2">
            {isDeleteTarget ? (
              <VscCheck className="text-red-500" />
            ) : (
              <span className="w-4 h-4 border border-gray-500 rounded-sm inline-block" />
            )}
          </span>
        )}

        {/* 파일을 보고 있는 사용자 아바타 표시 (파일일 때만, 왼쪽에 배치) */}
        {node.type === "FILE" && usersOnFile.length > 0 && (
          <div className="flex items-center" style={{ marginRight: "-10px" }}>
            {usersOnFile.slice(0, 3).map((user, idx) => (
              <div
                key={user.userId}
                className="relative shrink-0"
                style={{ marginLeft: idx > 0 ? "-2px" : "0" }}
                title={user.userName}
              >
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.userName}
                    className="rounded-full object-cover shrink-0"
                    style={{ width: "24px", height: "24px" }}
                  />
                ) : (
                  <div
                    className="rounded-full border border-[#1e1e1e] flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: user.color ?? "#6366f1",
                    }}
                  >
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {usersOnFile.length > 3 && (
              <div
                className="rounded-full bg-[#39586D] border border-[#2C4156] flex items-center justify-center text-[7px] text-[#F7F7F7] shrink-0"
                style={{ width: "16px", height: "16px", marginLeft: "-4px" }}
              >
                +{usersOnFile.length - 3}
              </div>
            )}
          </div>
        )}

        {/* 파일에 아바타가 없을 때만 간격 추가 */}
        {node.type === "FILE" && usersOnFile.length === 0 && (
          <span className="w-1" />
        )}

        {/* 폴더 화살표 아이콘 (폴더일 때만 표시) */}
        <span className="mr-1 w-4 flex justify-center opacity-80">
          {node.type === "DIR" &&
            (isOpen ? <VscChevronDown /> : <VscChevronRight />)}
        </span>

        {/* 파일/폴더 아이콘 */}
        <span className="mr-1.5 text-[14px]">
          {node.type === "DIR" ? (
            isOpen ? (
              <VscFolderOpened className="text-[#dcb67a]" />
            ) : (
              <VscFolder className="text-[#dcb67a]" />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </span>

        {/* 파일명 표시 (글자가 길면 툴팁으로 전체 이름 표시) */}
        <span className="truncate leading-6 flex-1" title={node.name}>
          {node.name}
        </span>
      </div>

      {/* 폴더가 열려있고 자식이 있다면 재귀적으로 렌더링합니다. */}
      {node.type === "DIR" && isOpen && node.children && (
        <div>
          {node.children.map((child: FileNode) => (
            <FileTreeItem
              key={child.fileId}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              fileLocations={fileLocations}
              // ===== 삭제 모드 props 전달 =====
              isDeleteMode={isDeleteMode}
              deleteTargetIds={deleteTargetIds}
              onToggleDeleteTarget={onToggleDeleteTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
};
