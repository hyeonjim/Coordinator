/**
 * AutoCompletePopup - 코드 자동완성 팝업 + 필터링 유틸리티
 *
 * [React 기초 - useRef]
 * - useRef는 DOM 요소에 직접 접근할 때 사용하는 훅
 * - listRef로 ul 요소에 접근, selectedRef로 선택된 li 요소에 접근
 * - scrollIntoView()로 선택 항목이 보이도록 스크롤 자동 이동
 *
 * [React 기초 - 조건부 렌더링]
 * - if (items.length === 0) return null → 항목이 없으면 팝업을 렌더링하지 않음
 *
 * [React 기초 - 이벤트 핸들링]
 * - onClick={() => onSelect(item)}: 항목 클릭 시 자동완성 삽입
 * - onMouseDown={(e) => e.preventDefault()}: 클릭 시 에디터가 포커스를 잃지 않도록 방지
 *
 * [사용된 기술]
 * - TypeScript Record 타입: 자동완성 항목 타입별 아이콘/색상 매핑
 * - 정렬 로직: 완전 일치 우선 → 타입별 정렬 → 알파벳 순
 */
import { useEffect, useRef } from "react";
import type { AutoCompletePopupProps, AutoCompleteItem } from "@/types/editor";
import { ALL_JAVA_ITEMS } from "./javaAutoCompleteData";

// 타입별 스타일 (keyword, class, method, snippet 각각의 아이콘과 색상)
const TYPE_STYLES: Record<AutoCompleteItem["type"], { icon: string; color: string }> = {
  keyword: { icon: "K", color: "#C586C0" },
  class: { icon: "C", color: "#4EC9B0" },
  method: { icon: "M", color: "#DCDCAA" },
  snippet: { icon: "S", color: "#CE9178" },
};

// 타입별 정렬 순서
const TYPE_ORDER: Record<AutoCompleteItem["type"], number> = {
  keyword: 0,
  class: 1,
  method: 2,
  snippet: 3,
};

// 입력된 접두사로 시작하는 항목 필터링
export function filterAutoComplete(prefix: string, maxResults = 10): AutoCompleteItem[] {
  if (!prefix) return [];

  const lowerPrefix = prefix.toLowerCase();

  const matches = ALL_JAVA_ITEMS.filter((item) =>
    item.label.toLowerCase().startsWith(lowerPrefix)
  );

  matches.sort((a, b) => {
    // 완전 일치 우선
    const aExact = a.label.toLowerCase() === lowerPrefix;
    const bExact = b.label.toLowerCase() === lowerPrefix;
    if (aExact !== bExact) return aExact ? -1 : 1;

    // 타입별 정렬
    if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];

    return a.label.localeCompare(b.label);
  });

  return matches.slice(0, maxResults);
}

// 커서 위치에서 현재 입력 중인 단어 추출
export function getCurrentWord(text: string, cursorOffset: number): { word: string; start: number } {
  const beforeCursor = text.slice(0, cursorOffset);
  const match = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);

  if (match) {
    return { word: match[0], start: cursorOffset - match[0].length };
  }

  return { word: "", start: cursorOffset };
}

// 자동완성 팝업 컴포넌트
export default function AutoCompletePopup({
  items, // 필터링된 자동완성 항목 배열
  selectedIndex, // 현재 키보드로 선택된 항목 인덱스
  position, // 팝업 표시 위치 { top, left }
  onSelect, // 항목 선택 시 실행될 콜백 함수
}: AutoCompletePopupProps) {
  // useRef: DOM 요소에 직접 접근하기 위한 참조 생성
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);

  // useEffect: selectedIndex가 바뀔 때마다 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed z-50 bg-[#1E1E1E] border border-[#454545] rounded shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        minWidth: "200px",
        maxWidth: "350px",
        maxHeight: "200px",
      }}
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
              <span className="flex-1 text-[#D4D4D4] text-sm truncate">{item.label}</span>
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
