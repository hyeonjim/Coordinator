// components/room/file-viewer/index.tsx
import { useState, type DragEvent } from "react";
import {
  getFileTree,
  readFileContent,
  type FileNode,
} from "../../../lib/utils"; // 아까 만든 로직

// --- 아이콘 가져오기 (VS Code 스타일) ---
// npm install react-icons 먼저 하셔야 해요!
import {
  VscChevronRight,
  VscChevronDown, // 화살표
  VscFolder,
  VscFolderOpened, // 폴더
  VscFile,
  VscNewFile, // 기본 파일
} from "react-icons/vsc";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiHtml5,
  SiCss3,
  SiJson,
} from "react-icons/si"; // 파일 확장자별 아이콘

// ==========================================
// 1. [도우미] 파일 이름 끝(확장자)을 보고 예쁜 아이콘 골라주는 함수
// ==========================================
const getFileIcon = (filename: string) => {
  const lowerName = filename.toLowerCase();
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
  return <VscFile className="text-gray-400" />; // 모르는 파일은 기본 아이콘
};

// ==========================================
// 2. [컴포넌트] 트리 아이템 (재귀함수처럼 자기 자신을 또 씀)
// ==========================================
interface FileTreeItemProps {
  node: FileNode; // 보여줄 파일 정보
  depth: number; // 얼마나 깊이 들어왔는지 (들여쓰기용)
  selectedPath: string | null; // 현재 선택된 파일 이름
  onSelect: (node: FileNode) => void; // 클릭했을 때 실행할 함수
}

const FileTreeItem = ({
  node,
  depth,
  selectedPath,
  onSelect,
}: FileTreeItemProps) => {
  // 폴더가 열려있는지 닫혀있는지 상태 (기본값: 닫힘)
  const [isOpen, setIsOpen] = useState(false);

  // 아이템을 클릭했을 때 동작
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 폴더 클릭 이벤트가 같이 터지는 걸 방지

    if (node.type === "folder") {
      setIsOpen(!isOpen); // 폴더면 열고 닫기 토글
    } else {
      onSelect(node); // 파일이면 "나 선택됐어!"라고 부모에게 알림
    }
  };

  // VS Code처럼 들여쓰기 계산 이래용 ㄷㄷ
  const paddingLeft = depth * 12 + 10;

  return (
    <div>
      {/* --- 한 줄(Row) 디자인 --- */}
      <div
        onClick={handleClick}
        className={`
          group flex items-center py-[3px] cursor-pointer select-none text-[13px] h-[26px]
          transition-colors duration-100
          ${
            // 선택된 파일이면? VS Code 특유의 파란 배경색 (#37373d)
            selectedPath === node.name && node.type === "file"
              ? "bg-[#37373d] text-white"
              : "text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white"
          }
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* 1. 화살표 (폴더일 때만 보임) */}
        <span className="mr-1 w-[16px] flex justify-center opacity-80">
          {node.type === "folder" &&
            // isOpen 상태에 따라 아이콘 변경 (닫힘: >, 열림: v)
            (isOpen ? <VscChevronDown /> : <VscChevronRight />)}
        </span>

        {/* 2. 파일/폴더 아이콘 */}
        <span className="mr-1.5 text-[14px]">
          {node.type === "folder" ? (
            isOpen ? (
              <VscFolderOpened className="text-[#dcb67a]" />
            ) : (
              <VscFolder className="text-[#dcb67a]" />
            )
          ) : (
            getFileIcon(node.name) // 아까 만든 도우미 함수로 아이콘 가져옴
          )}
        </span>

        {/* 3. 파일 이름 */}
        <span className="truncate leading-6">{node.name}</span>
        {/* leading 이 자식 설정 잘못하면 소문자 잘려서 보임 휴우  */}
      </div>

      {/* --- 자식들 보여주기 (재귀 렌더링) --- */}
      {/* 폴더이고, 열려있고, 자식이 있을 때만 렌더링 */}
      {node.type === "folder" && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeItem
              key={`${child.name}-${index}`} // 리액트가 헷갈리지 않게 고유 키 부여
              node={child} // 자식 데이터 전달
              depth={depth + 1} // 깊이 + 1 (들여쓰기 더 깊게)
              selectedPath={selectedPath} // 선택된 정보 전달
              onSelect={onSelect} // 클릭 함수 전달
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. [메인 컴포넌트] 전체 뷰어
// ==========================================
const FileViewer = () => {
  const [files, setFiles] = useState<FileNode[] | null>(null); // 파일 목록 상태
  const [isDragging, setIsDragging] = useState(false); // 드래그 중인지 체크
  const [selectedPath, setSelectedPath] = useState<string | null>(null); // 선택된 파일 이름

  // 파일이 드래그해서 영역 위로 올라왔을 때
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault(); // 브라우저가 파일 열어버리는 거 막기
    setIsDragging(true); // "드래그 들어왔다!" 상태 변경
  };

  // 파일이 영역 밖으로 나갔을 때
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // 파일을 딱 놓았을 때 (Drop)
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.items) {
      // utils.ts에서 만든 함수로 트리 구조 만들기
      const tree = await getFileTree(e.dataTransfer.items);
      setFiles(tree);
    }
  };

  // 🔥 [핵심 기능] 파일을 클릭했을 때 실행되는 함수
  const handleSelectFile = async (node: FileNode) => {
    setSelectedPath(node.name); // 화면에 선택 표시 (파란색)

    // 파일이고, 읽을 수 있는 데이터(fileEntry)가 있다면?
    if (node.type === "file" && node.fileEntry) {
      console.log(`Loading content for: ${node.name}...`);

      try {
        // utils.ts에서 만든 함수로 내용 읽어오기
        const content = await readFileContent(node.fileEntry);

        // 콘솔창에 결과 출력!
        console.group(`📄 File Content: ${node.name}`); // 로그 그룹화
        console.log(content);
        console.groupEnd();
      } catch (err) {
        console.error("파일 읽기 실패 ㅠㅠ", err);
      }
    }
  };

  return (
    // 전체 컨테이너 (VS Code 사이드바 색상: #252526)
    <div className="w-full h-full bg-[#252526] text-[#cccccc] flex flex-col font-sans select-none border-r border-[#1e1e1e]">
      {/* 상단 타이틀 바 */}
      <div className="flex items-center px-4 h-[35px] text-[11px] font-bold text-[#bbbbbb] tracking-wide uppercase bg-[#252526] hover:bg-[#2a2d2e] cursor-pointer">
        <span className="mr-1">
          <VscChevronDown />
        </span>
        <span>PROJECT-EXPLORER</span>
      </div>

      {/* 파일 리스트 영역 (스크롤 가능) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!files ? (
          // 1. 파일이 없을 때: 드래그 앤 드롭 안내 문구
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                h-full flex flex-col items-center justify-center p-6 text-center transition-colors
                ${isDragging ? "bg-[#37373d]/50 border-2 border-dashed border-[#007acc]" : ""}
            `}
          >
            {/* VS Code 느낌 아이콘 */}
            <div className="text-5xl mb-4 opacity-30">
              <VscNewFile />
            </div>
            <p className="text-[13px] text-[#858585]">
              폴더를 여기에 드래그하세요.
            </p>
          </div>
        ) : (
          // 2. 파일이 있을 때: 트리 보여주기
          <div className="py-1">
            {files.map((file, index) => (
              <FileTreeItem
                key={`${file.name}-${index}`}
                node={file}
                depth={0}
                selectedPath={selectedPath}
                onSelect={handleSelectFile} // 여기서 클릭 핸들러 전달!
              />
            ))}
          </div>
        )}
      </div>

      {/* 하단 상태바 (파란색 줄) */}
      <div className="bg-[#007acc] text-white text-[11px] flex items-center px-3 gap-3">
        <span>master*</span>
        <span>Run Code</span>
      </div>
    </div>
  );
};

export default FileViewer;
