/**
 * file-viewer/utils - 드래그&드롭 파일 트리 파싱 유틸리티
 *
 * [사용된 기술 - File System Access API]
 * - webkitGetAsEntry(): 드래그된 항목을 FileSystemEntry로 변환
 * - isFile / isDirectory: 파일인지 폴더인지 판별
 * - createReader().readEntries(): 폴더의 내용물을 비동기로 읽기
 *
 * [JavaScript 기초 - 비동기 프로그래밍]
 * - async/await: Promise 기반 비동기 코드를 동기 코드처럼 작성
 * - Promise: 미래에 완료될 작업을 나타내는 객체
 * - new Promise((resolve, reject) => ...): 콜백 기반 API를 Promise로 감싸기
 *
 * [설계 패턴 - 재귀 탐색]
 * - scanEntry: 파일이면 그대로 반환, 폴더면 자식들을 재귀 탐색
 * - readAllEntries: 폴더의 모든 엔트리를 반복적으로 읽기 (배치 단위)
 */
import type {
  LocalFileSystemEntry,
  LocalFileSystemFileEntry,
  LocalFileSystemDirectoryEntry,
  LocalFileSystemDirectoryReader,
} from "@/types/file";

// 드래그&드롭으로 읽은 파일/폴더의 내부 표현 타입
interface DragDropFileNode {
  name: string;
  type: "file" | "folder";
  children?: DragDropFileNode[];
  fileEntry?: LocalFileSystemFileEntry;
}

// 드래그된 항목들을 파일 트리 구조로 변환하는 진입점 함수
export async function getFileTree(
  items: DataTransferItemList,
): Promise<DragDropFileNode[]> {
  const entries: DragDropFileNode[] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.() as LocalFileSystemEntry | null;
    if (entry) {
      entries.push(await scanEntry(entry));
    }
  }

  return entries;
}

// 재귀 함수: 개별 엔트리를 DragDropFileNode로 변환
// 파일이면 바로 반환, 폴더면 자식들을 재귀적으로 스캔
async function scanEntry(entry: LocalFileSystemEntry): Promise<DragDropFileNode> {
  if (entry.isFile) {
    return {
      name: entry.name,
      type: "file",
      fileEntry: entry as LocalFileSystemFileEntry,
    };
  }

  if (entry.isDirectory) {
    const directoryEntry = entry as LocalFileSystemDirectoryEntry;
    const reader = directoryEntry.createReader();
    const entries = await readAllEntries(reader);
    const children = await Promise.all(entries.map(scanEntry));

    return {
      name: entry.name,
      type: "folder",
      children,
    };
  }

  return { name: "unknown", type: "file" };
}

// 폴더의 모든 엔트리를 읽는 함수
// readEntries()는 한 번에 일부만 반환할 수 있으므로, 빈 배열이 올 때까지 반복 호출
async function readAllEntries(
  reader: LocalFileSystemDirectoryReader,
): Promise<LocalFileSystemEntry[]> {
  const entries: LocalFileSystemEntry[] = [];

  const readBatch = (): Promise<void> =>
    new Promise((resolve, reject) => {
      reader.readEntries(
        (results) => {
          if (results.length === 0) {
            resolve();
          } else {
            entries.push(...(results as LocalFileSystemEntry[]));
            readBatch().then(resolve).catch(reject);
          }
        },
        reject,
      );
    });

  await readBatch();
  return entries;
}

// 파일 내용을 텍스트로 읽는 유틸리티
// 콜백 기반 File API를 Promise로 감싸서 async/await로 사용 가능하게 만듦
export function readFileContent(fileEntry: LocalFileSystemFileEntry): Promise<string> {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (file: File) => {
        const reader = new FileReader();
        reader.onloadend = (event) => resolve((event.target?.result as string) ?? "");
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsText(file);
      },
      reject,
    );
  });
}
