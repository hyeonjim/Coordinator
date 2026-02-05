import { useState } from "react";
import type { MouseEvent } from "react";
import { FaJava } from "react-icons/fa";
import {
  SiCss3,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiReact,
  SiTypescript,
} from "react-icons/si";
import {
  VscChevronDown,
  VscChevronRight,
  VscFile,
  VscFolder,
  VscFolderOpened,
} from "react-icons/vsc";
import type { FileNode } from "@/types/file/types";
import { useFileClickStore } from "@/stores/fileClick";

// 파일 확장자에 맞는 아이콘을 반환하는 헬퍼 함수입니다.
// 별도의 유틸 파일로 분리하지 않고 직관적으로 찾을 수 있도록 여기에 배치했습니다.
const getFileIcon = (filename: string) => {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith(".java")) return <FaJava className="text-[#e76f00]" />;
  if (lowerName.endsWith(".ts"))
    return <SiTypescript className="text-[#3178c6]" />;
  if (lowerName.endsWith(".tsx")) return <SiReact className="text-[#3178c6]" />;
  if (lowerName.endsWith(".js"))
    return <SiJavascript className="text-[#f7df1e]" />;
  if (lowerName.endsWith(".jsx")) return <SiReact className="text-[#f7df1e]" />;
  if (lowerName.endsWith(".html"))
    return <SiHtml5 className="text-[#e34c26]" />;
  if (lowerName.endsWith(".css")) return <SiCss3 className="text-[#264de4]" />;
  if (lowerName.endsWith(".json")) return <SiJson className="text-[#cbcb41]" />;

  // 기본 파일 아이콘
  return <VscFile className="text-gray-400" />;
};

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedId: number | null;
  onSelect: (node: FileNode) => void;
}

// 개별 파일 또는 폴더를 렌더링하는 컴포넌트입니다.
// 폴더일 경우 재귀적으로 자기 자신을 호출하여 하위 항목을 표시합니다.
export const FileTreeItem = ({
  node,
  depth,
  selectedId,
  onSelect,
}: FileTreeItemProps) => {
  // 폴더의 열림/닫힘 상태를 관리합니다.
  const [isOpen, setIsOpen] = useState(false);

  // 깊이(depth)에 따라 왼쪽 여백을 계산하여 계층 구조를 시각적으로 표현합니다.
  const paddingLeft = depth * 12 + 10;

  // 현재 노드가 선택된 파일인지 확인합니다.
  const isSelected = selectedId === node.fileId && node.type === "FILE";

  // 클릭 이벤트 핸들러입니다.
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const markClicked = useFileClickStore((state) => state.markClicked);
    e.stopPropagation(); // 이벤트 버블링을 방지합니다.

    if (node.type === "DIR") {
      // 폴더이면 열림/닫힘 상태를 토글합니다.
      setIsOpen(!isOpen);
    } else {
      // 파일이면 선택 이벤트를 상위로 전달합니다.
      onSelect(node);
      markClicked("AiTestReport.java"); // 예시: "AiTestReport.java" 파일 클릭 횟수 기록
    }
  };

  return (
    <div>
      {/* 파일/폴더 한 줄을 렌더링하는 영역 */}
      <div
        onClick={handleClick}
        className={`
          group flex items-center py-[3px] cursor-pointer select-none text-[13px] h-[26px] 
          transition-colors duration-100
          ${
            isSelected
              ? "bg-[#37373d] text-white" // 선택됨
              : "text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white" // 평상시 및 호버
          }
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* 폴더 화살표 아이콘 (폴더일 때만 표시) */}
        <span className="mr-1 w-[16px] flex justify-center opacity-80">
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

        {/* 파일명 표시 */}
        <span className="truncate leading-6">{node.name}</span>
      </div>

      {/* 폴더가 열려있고 자식이 있다면 재귀적으로 렌더링합니다. */}
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
