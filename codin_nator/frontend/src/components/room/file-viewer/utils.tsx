import React from "react";
import { FaJava } from "react-icons/fa";
import {
  SiCss3,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiReact,
  SiTypescript,
} from "react-icons/si";
import { VscFile } from "react-icons/vsc";
import type {
  FileNode,
  LocalFileSystemFileEntry,
  RawNode,
} from "../../../types/file/types";

/**
 * 파일 확장자에 따른 아이콘 반환
 */
export const getFileIcon = (filename: string) => {
  const lower = filename.toLowerCase();

  const iconMap: Record<string, React.JSX.Element> = {
    ".java": <FaJava className="text-[#e76f00]" />,
    ".ts": <SiTypescript className="text-[#3178c6]" />,
    ".tsx": <SiReact className="text-[#3178c6]" />,
    ".js": <SiJavascript className="text-[#f7df1e]" />,
    ".jsx": <SiReact className="text-[#f7df1e]" />,
    ".html": <SiHtml5 className="text-[#e34c26]" />,
    ".css": <SiCss3 className="text-[#264de4]" />,
    ".json": <SiJson className="text-[#cbcb41]" />,
  };

  const ext = Object.keys(iconMap).find((e) => lower.endsWith(e));
  return ext ? iconMap[ext] : <VscFile className="text-gray-400" />;
};

/**
 * API 응답 데이터를 배열 형태로 정규화
 * 다양한 응답 구조 ({files: ...}, {data: ...} 등)에 대응
 */
export const normalizeFileTree = (data: unknown): RawNode[] => {
  if (Array.isArray(data)) return data as RawNode[];

  const d = data as {
    files?: unknown[];
    data?: unknown[];
    result?: unknown[];
    fileTree?: unknown[];
  };
  return (d?.files || d?.data || d?.result || d?.fileTree || []) as RawNode[];
};

/**
 * API 데이터나 D&D 데이터를 UI 표시용 FileNode 구조로 표준화
 */
let tempIdSequence = 1;

export const sanitizeTree = (rawList: RawNode[]): FileNode[] => {
  const sanitizeNode = (n: RawNode): FileNode => {
    // 1. 타입 정규화 (DIR/FILE)
    const rawType = String(n.type ?? n.nodeType ?? n.kind ?? "").toUpperCase();

    // Check if it's a directory
    const isDir = rawType === "DIR" || rawType === "FOLDER";
    const type: "DIR" | "FILE" = isDir ? "DIR" : "FILE";

    // 2. ID 보장 (없으면 임시 ID 발급)
    const rawId = Number(n.fileId ?? n.id);
    const fileId =
      Number.isFinite(rawId) && rawId > 0 ? rawId : tempIdSequence++;

    // 3. 자식 재귀 처리
    const children = Array.isArray(n.children)
      ? (n.children as RawNode[]).map(sanitizeNode)
      : undefined;

    // 4. FileEntry Casting (Safe cast if logic implies it exists)
    const fileEntry = n.fileEntry as LocalFileSystemFileEntry | undefined;

    return {
      fileId,
      name: String(n.name ?? n.fileName ?? ""),
      type,
      children,
      fileEntry, // D&D 업로드용 원본 객체 유지
    };
  };

  return rawList.map(sanitizeNode);
};
