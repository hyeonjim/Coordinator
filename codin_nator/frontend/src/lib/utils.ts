import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  LocalFileSystemEntry,
  LocalFileSystemFileEntry,
  LocalFileSystemDirectoryEntry,
  LocalFileSystemDirectoryReader,
} from "../types/room/file/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 전역 유틸: 파일 및 폴더 처리를 위한 타입
 */
export interface FileNode {
  name: string; // 파일 이름
  type: "file" | "folder"; // 구분
  children?: FileNode[]; // 자식 노드
  fileEntry?: LocalFileSystemFileEntry; // 원본 파일 객체
}

/**
 * 1. DataTransferItemList를 트리 구조로 변환
 */
export const getFileTree = async (
  items: DataTransferItemList,
): Promise<FileNode[]> => {
  const entries: FileNode[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // webkitGetAsEntry: 브라우저 API를 통해 파일/폴더 엔트리 획득
    const entry = item.webkitGetAsEntry?.() as LocalFileSystemEntry | null;

    if (entry) {
      const node = await scanEntry(entry);
      entries.push(node);
    }
  }

  return entries;
};

/**
 * 2. 개별 엔트리를 분석하는 재귀 함수
 */
const scanEntry = async (entry: LocalFileSystemEntry): Promise<FileNode> => {
  if (entry.isFile) {
    return {
      name: entry.name,
      type: "file",
      fileEntry: entry as LocalFileSystemFileEntry,
    };
  } else if (entry.isDirectory) {
    const dirEntry = entry as LocalFileSystemDirectoryEntry;
    const dirReader = dirEntry.createReader();
    const entries = await readAllEntries(dirReader);

    // 하위 항목들에 대해 재귀적으로 처리
    const children = await Promise.all(entries.map((e) => scanEntry(e)));

    return {
      name: entry.name,
      type: "folder",
      children: children,
    };
  }

  return { name: "unknown", type: "file" };
};

/**
 * 3. 디렉토리 내부의 모든 엔트리를 읽어오는 도우미 함수
 */
const readAllEntries = async (
  dirReader: LocalFileSystemDirectoryReader,
): Promise<LocalFileSystemEntry[]> => {
  const entries: LocalFileSystemEntry[] = [];

  const read = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      dirReader.readEntries(
        (results) => {
          if (results.length === 0) {
            resolve();
          } else {
            entries.push(...(results as LocalFileSystemEntry[]));
            read().then(resolve).catch(reject);
          }
        },
        (err) => reject(err),
      );
    });
  };

  await read();
  return entries;
};

/**
 * 4. 파일 엔트리에서 텍스트 내용을 읽어오는 함수
 */
export const readFileContent = (
  fileEntry: LocalFileSystemFileEntry,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (file: File) => {
        const reader = new FileReader();

        reader.onloadend = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            resolve("");
          }
        };

        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsText(file);
      },
      (err) => reject(err),
    );
  });
};
