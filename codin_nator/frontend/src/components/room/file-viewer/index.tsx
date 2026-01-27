import { VscChevronDown, VscFolderOpened, VscLoading } from "react-icons/vsc";
import { FileTreeItem } from "./FileTreeItem";
import { useFileViewer } from "./useFileViewer";

interface FileViewerProps {
  roomId: number;
  onFileSelect?: (fileId: number, content: string, fileName: string) => void;
}

/**
 * 프로젝트 파일 탐색기 컴포넌트
 * - 파일 목록 조회, 선택, 드래그 앤 드롭 업로드 기능 제공
 */
const FileViewer = (props: FileViewerProps) => {
  // 로직은 커스텀 훅으로 분리하여 코드를 간결하게 유지
  const {
    files,
    loading,
    selectedId,
    handleSelectFile,
    handleDragOver,
    handleDrop,
  } = useFileViewer(props);

  return (
    <div
      className="w-full h-full bg-[#252526] text-[#cccccc] flex flex-col font-sans select-none border-r border-[#1e1e1e]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 1. 탐색기 헤더 */}
      <div className="flex items-center px-4 h-[35px] text-[11px] font-bold text-[#bbbbbb] tracking-wide uppercase bg-[#252526] hover:bg-[#2a2d2e] cursor-pointer">
        <span className="mr-1">
          <VscChevronDown />
        </span>
        <span>PROJECT-EXPLORER</span>
      </div>

      {/* 2. 파일 목록 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {loading ? (
          // 로딩 상태
          <div className="flex justify-center items-center h-20 text-[#cccccc]">
            <VscLoading className="animate-spin text-2xl" />
          </div>
        ) : files.length === 0 ? (
          // 빈 상태 & 드래그 안내
          <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-[#858585] opacity-50 space-y-2">
            <VscFolderOpened className="text-4xl" />
            <span className="text-sm">파일이 없습니다.</span>
            <span className="text-xs">(.zip 파일을 이곳에 드래그하세요)</span>
          </div>
        ) : (
          // 트리 렌더링
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

      {/* 3. 하단 상태바 */}
      <div className="h-[22px] bg-[#007acc] text-white text-[11px] flex items-center px-3 gap-3">
        <span>master*</span>
        <span>Run Code</span>
      </div>
    </div>
  );
};

export default FileViewer;
