import { useState } from "react";
import type { MouseEvent } from "react";
import {
  VscChevronDown,
  VscChevronRight,
  VscFolder,
  VscFolderOpened,
} from "react-icons/vsc";
import type { FileNode } from "./types";
import { getFileIcon } from "./utils";

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedId: number | null;
  onSelect: (node: FileNode) => void;
}

/**
 * 개별 파일/폴더 아이템 컴포넌트 (재귀 렌더링)
 */
export const FileTreeItem = ({
  node,
  depth,
  selectedId,
  onSelect,
}: FileTreeItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // 깊이에 따른 들여쓰기 계산
  const paddingLeft = depth * 12 + 10;
  const isSelected = selectedId === node.fileId && node.type === "FILE";

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (node.type === "DIR") {
      setIsOpen((prev) => !prev);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      {/* 1. 아이템 행 */}
      <div
        onClick={handleClick}
        className={`
          group flex items-center py-[3px] cursor-pointer select-none text-[13px] h-[26px] 
          transition-colors duration-100
          ${isSelected ? "bg-[#37373d] text-white" : "text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white"}
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* 화살표 (폴더인 경우만) */}
        <span className="mr-1 w-[16px] flex justify-center opacity-80">
          {node.type === "DIR" &&
            (isOpen ? <VscChevronDown /> : <VscChevronRight />)}
        </span>

        {/* 아이콘 */}
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

        {/* 파일명 */}
        <span className="truncate leading-6">{node.name}</span>
      </div>

      {/* 2. 자식 렌더링 (재귀) */}
      {node.type === "DIR" && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.fileId}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
