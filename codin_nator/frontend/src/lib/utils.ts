import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 여기서는 로직 구현핑

// 1. 파일인지 폴더인지 확인
// 2. 폴더면 내부 파일 읽기 (재귀함수 등 복잡한 로직)  ㄷㄷㄷㄷ
// 3. 깔끔한 객체로 변환

// components/room/file-viewer/utils.ts

// 파일과 폴더의 모양(Type)을 미리 정해둡니다.
export interface FileNode {
  name: string; // 파일 이름 (예: App.tsx)
  type: "file" | "folder"; // 파일인지 폴더인지 구분
  children?: FileNode[]; // 폴더면 자식 파일들을 가짐 (재귀 구조)
  fileEntry?: any; // 🔥 [핵심] 나중에 내용을 읽기 위한 '원본 파일 객체'
}

/**
 * 1. 드래그된 아이템 리스트를 받아서 우리가 쓸 수 있는 트리 구조로 변환하는 함수
 * @param items 드래그 앤 드롭 이벤트로 들어온 원본 데이터 리스트
 */
export const getFileTree = async (
  items: DataTransferItemList,
): Promise<FileNode[]> => {
  const entries: FileNode[] = [];

  // 드롭된 아이템 개수만큼 반복합니다.
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // item.webkitGetAsEntry()는 브라우저가 파일을 읽기 좋게 변환해주는 함수입니다.
    // (타입스크립트가 못 알아먹을 수 있어서 있으면 쓰고 없으면 null 처리)
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;

    if (entry) {
      // scanEntry 함수에게 "이거 분석해서 트리로 만들어줘"라고 시킵니다.
      const node = await scanEntry(entry);
      entries.push(node);
    }
  }

  return entries;
};

/**
 * 2. 실제 파일/폴더 하나를 분석하는 재귀 함수 (마트료시카 까기)
 * @param entry 분석할 파일 객체
 */
const scanEntry = async (entry: any): Promise<FileNode> => {
  // [경우 1] 만약 파일이라면?
  if (entry.isFile) {
    return {
      name: entry.name, // 이름 저장
      type: "file", // 타입은 파일
      fileEntry: entry, // 🔥 나중에 내용을 읽기 위해 열쇠(원본)를 저장해둠
    };
  }
  // [경우 2] 만약 폴더(디렉토리)라면?
  else if (entry.isDirectory) {
    // 폴더 내부를 읽는 도구(Reader)를 만듭니다.
    const dirReader = entry.createReader();
    // 폴더 안의 모든 파일들을 다 읽어옵니다.
    const entries = await readAllEntries(dirReader);

    // 가져온 파일들을 다시 scanEntry에 넣어서 분석합니다. (재귀 호출!)
    // 폴더 안에 또 폴더가 있을 수 있으니까요.
    const children = await Promise.all(entries.map(scanEntry));

    return {
      name: entry.name,
      type: "folder",
      children: children, // 자식들 명단 저장
    };
  }

  // 파일도 폴더도 아니면(에러 방지) 그냥 껍데기만 리턴
  return { name: "unknown", type: "file" };
};

/**
 * 3. 폴더 안의 내용물을 끝까지 다 읽어오는 도우미 함수
 * (옛날 방식 API라 한 번에 100개씩만 읽어와서, 다 읽을 때까지 반복해야 함)
 */
const readAllEntries = async (dirReader: any): Promise<any[]> => {
  const entries: any[] = [];

  // 비동기 반복을 위한 재귀 함수 정의
  const read = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // readEntries: 폴더 내용을 읽어라!
      dirReader.readEntries((results: any[]) => {
        if (results.length === 0) {
          resolve(); // 더 이상 읽을 게 없으면 끝!
        } else {
          entries.push(...results); // 읽은 거 장바구니에 담고
          read().then(resolve); // 다시 읽으러 감 (반복)
        }
      }, reject); // 에러 나면 멈춤
    });
  };

  await read(); // 다 읽을 때까지 기다림
  return entries;
};

/**
 * 4. 🔥 [추가된 기능] 파일 내용을 실제로 읽어서 텍스트로 주는 함수
 * @param fileEntry 아까 저장해둔 원본 파일 객체
 */
export const readFileContent = (fileEntry: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Entry에서 실제 File 데이터를 꺼냅니다.
    fileEntry.file(
      (file: File) => {
        // 브라우저의 파일 읽기 도구(FileReader) 생성
        const reader = new FileReader();

        // 다 읽었으면 실행되는 함수
        reader.onloadend = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string); // 성공하면 내용 리턴
          } else {
            resolve(""); // 내용 없으면 빈 문자열
          }
        };

        reader.onerror = reject; // 에러 처리
        reader.readAsText(file); // "이 파일을 텍스트로 읽어줘!" 명령 시작
      },
      (err: any) => reject(err),
    );
  });
};
