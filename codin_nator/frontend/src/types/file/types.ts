// --- 1. File System Access API Types (Local definitions to avoid global conflicts) ---
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

// --- 2. Existing FileNode Definitions ---

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
  // Store the original entry for upload handling
  fileEntry?: LocalFileSystemFileEntry;
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
  // Allow loose type string for D&D compatibility ("file", "folder")
  type?: string;
  children?: RawNode[];
};

/**
 * FileViewer 컴포넌트 Props
 */
export interface FileViewerProps {
  roomId: number;
  onFileSelect?: (fileId: number, content: string, fileName: string) => void;
}

/**
 * FileTreeItem 컴포넌트 Props
 */
export interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedId: number | null;
  onSelect: (node: FileNode) => void;
}
