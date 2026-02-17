/**
 * @file file.ts - 파일 트리 및 파일 시스템 관련 타입 정의
 *
 * 프로젝트 파일 탐색기(File Explorer)의 트리 구조와
 * File System Access API 관련 타입을 정의합니다.
 *
 * 주요 개념:
 * - FileNode: 트리 구조의 파일/디렉토리 노드 (재귀적 children)
 * - LocalFileSystem*: 브라우저의 File System Access API 타입 (드래그 앤 드롭 업로드용)
 * - FileLocation: 어떤 사용자가 어떤 파일을 보고 있는지 실시간 표시
 *
 * 통합 출처:
 * - types/room/file/types.ts
 */

import type { Participant } from "@/types/room";

/**
 * 로컬 파일 시스템 엔트리 (기본)
 *
 * 브라우저의 File System Access API에서 제공하는 파일/디렉토리 엔트리입니다.
 * 드래그 앤 드롭으로 파일을 업로드할 때 DataTransferItem.webkitGetAsEntry()로 획득합니다.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemEntry
 */
export interface LocalFileSystemEntry {
  /** 파일인지 여부 */
  isFile: boolean;

  /** 디렉토리인지 여부 */
  isDirectory: boolean;

  /** 파일/디렉토리 이름 */
  name: string;

  /** 전체 경로 (루트부터) */
  fullPath: string;

  /** 소속 파일 시스템 */
  filesystem: FileSystem;

  /** 부모 디렉토리 엔트리를 가져오는 메서드 */
  getParent: (
    successCallback?: (entry: LocalFileSystemEntry) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

/**
 * 로컬 파일 엔트리
 *
 * isFile이 true로 고정된 파일 엔트리입니다.
 * file() 메서드로 실제 File 객체를 가져올 수 있습니다.
 */
export interface LocalFileSystemFileEntry extends LocalFileSystemEntry {
  isFile: true;
  isDirectory: false;

  /**
   * File 객체를 비동기로 가져옵니다.
   * 콜백 패턴을 사용합니다 (레거시 Web API).
   */
  file: (
    successCallback: (file: File) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

/**
 * 디렉토리 리더
 *
 * readEntries()로 디렉토리 내 파일/하위 디렉토리 목록을 읽습니다.
 * 한 번 호출에 모든 엔트리가 반환되지 않을 수 있어 빈 배열이 올 때까지 반복 호출해야 합니다.
 */
export interface LocalFileSystemDirectoryReader {
  readEntries: (
    successCallback: (entries: LocalFileSystemEntry[]) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

/**
 * 로컬 디렉토리 엔트리
 *
 * isDirectory가 true로 고정된 디렉토리 엔트리입니다.
 * createReader()로 내부 파일 목록을 읽는 리더를 생성합니다.
 */
export interface LocalFileSystemDirectoryEntry extends LocalFileSystemEntry {
  isFile: false;
  isDirectory: true;

  /** 디렉토리 내용을 읽기 위한 리더 생성 */
  createReader: () => LocalFileSystemDirectoryReader;
}

/**
 * 파일 타입 (파일 또는 디렉토리)
 */
export type FileType = "DIR" | "FILE";

/**
 * 파일 트리 노드
 *
 * 파일 탐색기의 트리 구조를 표현하는 재귀적(recursive) 인터페이스입니다.
 * children 필드로 하위 노드를 포함하여 트리 구조를 형성합니다.
 *
 * @example
 * ```ts
 * const root: FileNode = {
 *   fileId: 1,
 *   name: "src",
 *   type: "DIR",
 *   children: [
 *     { fileId: 2, name: "App.tsx", type: "FILE" },
 *     { fileId: 3, name: "index.ts", type: "FILE" },
 *   ],
 * };
 * ```
 */
export interface FileNode {
  /** 파일/디렉토리 고유 ID (백엔드 DB 기준) */
  fileId: number;

  /** 파일/디렉토리 이름 */
  name: string;

  /** 파일인지 디렉토리인지 */
  type: FileType;

  /** 하위 노드 (디렉토리인 경우에만 존재) */
  children?: FileNode[];

  /** 로컬 파일 엔트리 (드래그 앤 드롭 업로드 시 사용) */
  fileEntry?: LocalFileSystemFileEntry;
}

/**
 * 백엔드 응답의 원시 노드 타입
 *
 * 백엔드 API 응답은 다양한 필드명 컨벤션을 사용할 수 있어
 * 모든 가능한 필드를 optional로 정의합니다.
 * normalizeFileTree 함수에서 FileNode로 변환됩니다.
 */
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

/**
 * 파일을 보고 있는 사용자 정보
 *
 * Participant에서 필요한 필드만 Pick 유틸리티 타입으로 추출합니다.
 * Pick<T, K>는 타입 T에서 K에 해당하는 프로퍼티만 선택하여 새 타입을 만듭니다.
 */
export type FileViewerUser = Pick<Participant, "userId" | "userName" | "imageUrl">;

/**
 * Yjs awareness에 저장되는 파일 위치 데이터
 *
 * 각 사용자가 현재 어떤 파일을 보고 있는지 awareness로 공유합니다.
 */
export interface FileAwarenessData extends FileViewerUser {
  /** 현재 열고 있는 파일 ID */
  currentFileId?: number;
}

/**
 * 파일별 사용자 위치 상태
 *
 * 파일 트리에서 각 파일 옆에 해당 파일을 보고 있는 사용자 아바타를 표시하는 데 사용됩니다.
 */
export interface FileLocationState {
  /** 파일 ID */
  fileId: number;

  /** 이 파일을 보고 있는 사용자 목록 */
  users: FileViewerUser[];
}

/**
 * 파일 트리 항목 컴포넌트 Props
 *
 * 재귀적으로 렌더링되는 파일 트리의 개별 항목(행)입니다.
 * depth로 들여쓰기 수준을 제어합니다.
 */
export interface FileTreeItemProps {
  /** 표시할 파일/디렉토리 노드 */
  node: FileNode;

  /** 트리 깊이 (들여쓰기 레벨, 루트=0) */
  depth: number;

  /** 현재 선택된 파일 ID (하이라이트 표시용) */
  selectedId: number | null;

  /** 파일/디렉토리 클릭 시 핸들러 */
  onSelect?: (node: FileNode) => void;

  /** 각 파일에 대한 사용자 위치 정보 (아바타 표시용) */
  fileLocations: FileLocationState[];

  /** 삭제 모드 활성화 여부 */
  isDeleteMode?: boolean;

  /** 삭제 대상으로 선택된 파일 ID 집합 */
  deleteTargetIds?: Set<number>;

  /** 삭제 대상 토글 핸들러 */
  onToggleDeleteTarget?: (fileId: number) => void;
}
