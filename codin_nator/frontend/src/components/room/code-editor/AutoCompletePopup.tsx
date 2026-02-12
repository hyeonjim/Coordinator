import { useEffect, useRef } from "react";
import type { AutoCompletePopupProps } from "@/types/room/editor/types";
import type { AutoCompleteItem } from "@/types/room/editor/javaAutoComplete";

// 타입별 아이콘/색상
const TYPE_STYLES: Record<AutoCompleteItem["type"], { icon: string; color: string }> = {
  keyword: { icon: "K", color: "#C586C0" },
  class:   { icon: "C", color: "#4EC9B0" },
  method:  { icon: "M", color: "#DCDCAA" },
  snippet: { icon: "S", color: "#CE9178" },
};

// Java 키워드
const JAVA_KEYWORDS: AutoCompleteItem[] = [
  { label: "public",      type: "keyword" },
  { label: "private",     type: "keyword" },
  { label: "protected",   type: "keyword" },
  { label: "class",       type: "keyword" },
  { label: "interface",   type: "keyword" },
  { label: "extends",     type: "keyword" },
  { label: "implements",  type: "keyword" },
  { label: "abstract",    type: "keyword" },
  { label: "if",          type: "keyword" },
  { label: "else",        type: "keyword" },
  { label: "for",         type: "keyword" },
  { label: "while",       type: "keyword" },
  { label: "do",          type: "keyword" },
  { label: "switch",      type: "keyword" },
  { label: "case",        type: "keyword" },
  { label: "default",     type: "keyword" },
  { label: "break",       type: "keyword" },
  { label: "continue",    type: "keyword" },
  { label: "return",      type: "keyword" },
  { label: "try",         type: "keyword" },
  { label: "catch",       type: "keyword" },
  { label: "finally",     type: "keyword" },
  { label: "throw",       type: "keyword" },
  { label: "throws",      type: "keyword" },
  { label: "new",         type: "keyword" },
  { label: "this",        type: "keyword" },
  { label: "super",       type: "keyword" },
  { label: "static",      type: "keyword" },
  { label: "final",       type: "keyword" },
  { label: "void",        type: "keyword" },
  { label: "null",        type: "keyword" },
  { label: "true",        type: "keyword" },
  { label: "false",       type: "keyword" },
  { label: "import",      type: "keyword" },
  { label: "package",     type: "keyword" },
  { label: "instanceof",  type: "keyword" },
  // 기본 타입
  { label: "int",         type: "keyword" },
  { label: "long",        type: "keyword" },
  { label: "short",       type: "keyword" },
  { label: "byte",        type: "keyword" },
  { label: "float",       type: "keyword" },
  { label: "double",      type: "keyword" },
  { label: "boolean",     type: "keyword" },
  { label: "char",        type: "keyword" },
];

// Java 내장 클래스
const JAVA_CLASSES: AutoCompleteItem[] = [
  { label: "String",              type: "class" },
  { label: "Integer",             type: "class" },
  { label: "Long",                type: "class" },
  { label: "Double",              type: "class" },
  { label: "Boolean",             type: "class" },
  { label: "Character",           type: "class" },
  { label: "Object",              type: "class" },
  { label: "ArrayList",           type: "class" },
  { label: "LinkedList",          type: "class" },
  { label: "HashMap",             type: "class" },
  { label: "HashSet",             type: "class" },
  { label: "TreeMap",             type: "class" },
  { label: "TreeSet",             type: "class" },
  { label: "List",                type: "class" },
  { label: "Map",                 type: "class" },
  { label: "Set",                 type: "class" },
  { label: "Scanner",             type: "class" },
  { label: "BufferedReader",      type: "class" },
  { label: "BufferedWriter",      type: "class" },
  { label: "FileReader",          type: "class" },
  { label: "FileWriter",          type: "class" },
  { label: "Arrays",              type: "class" },
  { label: "Collections",         type: "class" },
  { label: "Math",                type: "class" },
  { label: "System",              type: "class" },
  { label: "Exception",           type: "class" },
  { label: "RuntimeException",    type: "class" },
  { label: "NullPointerException",type: "class" },
  { label: "IOException",         type: "class" },
];

// 자주 사용하는 메서드/스니펫
const JAVA_METHODS: AutoCompleteItem[] = [
  { label: "println",   type: "method",  insertText: "System.out.println();" },
  { label: "print",     type: "method",  insertText: "System.out.print();" },
  { label: "printf",    type: "method",  insertText: "System.out.printf();" },
  { label: "main",      type: "snippet", insertText: "public static void main(String[] args) {\n    \n}" },
  { label: "psvm",      type: "snippet", insertText: "public static void main(String[] args) {\n    \n}" },
  { label: "toString",  type: "method" },
  { label: "equals",    type: "method" },
  { label: "hashCode",  type: "method" },
  { label: "length",    type: "method" },
  { label: "size",      type: "method" },
  { label: "get",       type: "method" },
  { label: "set",       type: "method" },
  { label: "add",       type: "method" },
  { label: "remove",    type: "method" },
  { label: "contains",  type: "method" },
  { label: "isEmpty",   type: "method" },
];

const ALL_ITEMS: AutoCompleteItem[] = [
  ...JAVA_KEYWORDS,
  ...JAVA_CLASSES,
  ...JAVA_METHODS,
];

// 입력된 접두사로 시작하는 항목 필터링
export function filterAutoComplete(
  prefix: string,
  maxResults: number = 10
): AutoCompleteItem[] {
  if (!prefix) return [];

  const lowerPrefix = prefix.toLowerCase();

  const matches = ALL_ITEMS.filter((item) =>
    item.label.toLowerCase().startsWith(lowerPrefix)
  );

  matches.sort((a, b) => {
    const aExact = a.label.toLowerCase() === lowerPrefix;
    const bExact = b.label.toLowerCase() === lowerPrefix;
    if (aExact !== bExact) return aExact ? -1 : 1;

    const typeOrder = { keyword: 0, class: 1, method: 2, snippet: 3 };
    if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];

    return a.label.localeCompare(b.label);
  });

  return matches.slice(0, maxResults);
}

// 커서 위치에서 현재 입력 중인 단어 추출
export function getCurrentWord(
  text: string,
  cursorOffset: number
): { word: string; start: number } {
  const beforeCursor = text.slice(0, cursorOffset);
  const match = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);

  if (match) {
    return { word: match[0], start: cursorOffset - match[0].length };
  }

  return { word: "", start: cursorOffset };
}

export default function AutoCompletePopup({
  items,
  selectedIndex,
  position,
  onSelect,
}: AutoCompletePopupProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed z-50 bg-[#1E1E1E] border border-[#454545] rounded shadow-lg"
      style={{ top: position.top, left: position.left, minWidth: "200px", maxWidth: "350px", maxHeight: "200px" }}
    >
      <ul ref={listRef} className="overflow-y-auto max-h-50 py-1">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const style = TYPE_STYLES[item.type];

          return (
            <li
              key={`${item.label}-${index}`}
              ref={isSelected ? selectedRef : null}
              className={`flex items-center gap-2 px-2 py-1 cursor-pointer ${
                isSelected ? "bg-[#094771]" : "hover:bg-[#2A2D2E]"
              }`}
              onClick={() => onSelect(item)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span
                className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded"
                style={{ backgroundColor: style.color + "33", color: style.color }}
              >
                {style.icon}
              </span>
              <span className="flex-1 text-[#D4D4D4] text-sm truncate">
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-[#454545] px-2 py-1 text-xs text-[#808080]">
        ↑↓ 이동 · Enter 선택 · Esc 닫기
      </div>
    </div>
  );
}
