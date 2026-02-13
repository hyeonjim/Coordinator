import type { Participant } from "@/types/room/types";

// File System Access API Types
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

// File Tree Node Types
export type FileType = "DIR" | "FILE";

export interface FileNode {
  fileId: number;
  name: string;
  type: FileType;
  children?: FileNode[];
  fileEntry?: LocalFileSystemFileEntry;
}

export type RawNode = {
  fileId?: number;
  id?: number;
  name?: string;
  fileName?: string;
  type?: string;
  nodeType?: string;
  kind?: string;
  fileEntry?: unknown;
  children?: RawNode[];
};

// File Location Types
export type FileViewerUser = Pick<Participant, "userId" | "userName" | "imageUrl">;

export interface FileAwarenessData extends FileViewerUser {
  currentFileId?: number;
}

export interface FileLocationState {
  fileId: number;
  users: FileViewerUser[];
}

// Component Props
export interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedId: number | null;
  onSelect?: (node: FileNode) => void;
  fileLocations: FileLocationState[];
  isDeleteMode?: boolean;
  deleteTargetIds?: Set<number>;
  onToggleDeleteTarget?: (fileId: number) => void;
}
