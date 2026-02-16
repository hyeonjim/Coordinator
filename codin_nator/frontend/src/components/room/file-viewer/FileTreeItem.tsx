import { useState } from "react";
import type { MouseEvent } from "react";
import { FaJava } from "react-icons/fa";
import {
  VscChevronDown,
  VscChevronRight,
  VscFile,
  VscFolder,
  VscFolderOpened,
  VscCheck,
} from "react-icons/vsc";
import type { FileNode, FileTreeItemProps } from "@/types/room/file/types";

function getFileIcon(filename: string) {
  if (filename.toLowerCase().endsWith(".java")) {
    return <FaJava className="text-[#e76f00]" />;
  }
  return <VscFile className="text-gray-400" />;
}

export function FileTreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  fileLocations,
  isDeleteMode = false,
  deleteTargetIds,
  onToggleDeleteTarget,
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isDeleteTarget = deleteTargetIds?.has(node.fileId) ?? false;
  const usersOnFile = fileLocations.find((location) => location.fileId === node.fileId)?.users ?? [];
  const paddingLeft = depth * 12 + 10;
  const isSelected = selectedId === node.fileId && node.type === "FILE";

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (isDeleteMode) {
      onToggleDeleteTarget?.(node.fileId);
      return;
    }

    if (node.type === "DIR") {
      setIsOpen(!isOpen);
    } else {
      onSelect?.(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={[
          "flex items-center py-1 cursor-pointer select-none text-[13px] h-6.5 transition-colors duration-100",
          "text-(--rc-tree-text) hover:bg-(--rc-tree-hover)",
          isSelected ? "bg-(--rc-tree-selected-bg)! text-(--rc-tree-selected-text)!" : "",
          isDeleteMode ? "hover:bg-(--rc-del-item-hover)!" : "",
          isDeleteTarget ? "bg-(--rc-del-target-bg)! border-l-[3px] border-(--rc-del-target-border) hover:bg-(--rc-del-target-hover)!" : "",
        ].join(" ")}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {isDeleteMode && (
          <span className="flex items-center justify-center min-w-4 mr-2">
            {isDeleteTarget ? (
              <VscCheck className="text-red-500" />
            ) : (
              <span className="w-4 h-4 border border-gray-500 rounded-sm inline-block" />
            )}
          </span>
        )}

        {node.type === "FILE" && usersOnFile.length > 0 && (
          <div className="flex items-center" style={{ marginRight: "-10px" }}>
            {usersOnFile.slice(0, 3).map((user, index) => (
              <div
                key={user.userId}
                className="relative shrink-0"
                style={{ marginLeft: index > 0 ? "-2px" : "0" }}
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
                    style={{ width: "16px", height: "16px", backgroundColor: "#6366f1" }}
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

        {node.type === "FILE" && usersOnFile.length === 0 && <span className="w-1" />}

        <span className="mr-1 w-4 flex justify-center opacity-80">
          {node.type === "DIR" && (isOpen ? <VscChevronDown /> : <VscChevronRight />)}
        </span>

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

        <span className="truncate leading-6 flex-1" title={node.name}>
          {node.name}
        </span>
      </div>

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
              isDeleteMode={isDeleteMode}
              deleteTargetIds={deleteTargetIds}
              onToggleDeleteTarget={onToggleDeleteTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
