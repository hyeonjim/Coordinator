/**
 * ========================================
 * 1. File System Access API Types
 * ========================================
 * 로컬 파일 시스템 드래그앤드롭 처리를 위한 타입 정의
 */

export interface LocalFileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  filesystem: FileSystem;
  getParent: (
    successCallback?: (entry: LocalFileSystemEntry) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

export interface LocalFileSystemFileEntry extends LocalFileSystemEntry {
  isFile: true;
  isDirectory: false;
  file: (
    successCallback: (file: File) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

export interface LocalFileSystemDirectoryReader {
  readEntries: (
    successCallback: (entries: LocalFileSystemEntry[]) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

export interface LocalFileSystemDirectoryEntry extends LocalFileSystemEntry {
  isFile: false;
  isDirectory: true;
  createReader: () => LocalFileSystemDirectoryReader;
}

/**
 * ========================================
 * 2. File Tree Node Types
 * ========================================
 * 파일 트리 구조를 표현하는 타입 정의
 */

/**
 * Backend API Response type for File Node
 */
export interface BackendFileNode {
  fileId: number;
  name: string;
  type: "DIR" | "FILE";
  children?: BackendFileNode[];
}

/**
 * Common structure for FileViewer
 */
export interface FileNode {
  fileId: number;
  name: string;
  type: "DIR" | "FILE";
  children?: FileNode[];
  fileEntry?: LocalFileSystemFileEntry; // 드래그앤드롭 업로드용
}

/**
 * Raw Node type for flexible inputs (Backend or D&D)
 */
export type RawNode = Partial<BackendFileNode> & {
  fileName?: string;
  nodeType?: string;
  kind?: string;
  fileEntry?: unknown;
  id?: number;
  type?: string; // "file", "folder" 등 유연한 문자열 허용
  children?: RawNode[];
};

/**
 * ========================================
 * 3. File Viewer Component Props
 * ========================================
 */

/**
 * 파일을 보고 있는 사용자 정보
 * Participant 타입 기반으로 색상 추가
 */
export interface FileViewerUser {
  userId: string;
  userName: string;
  imageUrl?: string;
  color?: string;
}

/**
 * 파일별 사용자 위치 정보
 */
export interface FileLocationState {
  fileId: number;
  users: FileViewerUser[];
}

/**
 * FileViewer 컴포넌트 Props
 */
export interface FileViewerProps {
  roomId: number;
  onFileSelect?: (fileId: number, content: string, fileName: string) => void;
  userId?: string;
  userName?: string;
  userImageUrl?: string;
}

/**
 * FileTreeItem 컴포넌트 Props
 */
export interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedId: number | null;
  onSelect: (node: FileNode) => void;
  fileLocations: FileLocationState[]; // 모든 파일의 사용자 위치 정보
}
