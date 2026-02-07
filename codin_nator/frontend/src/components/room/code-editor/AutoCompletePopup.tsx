/**
 * 자동완성 팝업 컴포넌트
 * - 매칭되는 항목들을 목록으로 표시
 * - 키보드(위/아래/Enter/Esc)로 선택 가능
 * - 마우스 클릭으로도 선택 가능
 */

import { useEffect, useRef } from "react";
import type { AutoCompleteItem } from "./javaAutoComplete";

// ===========================
// Props 타입 정의
// ===========================
interface AutoCompletePopupProps {
  items: AutoCompleteItem[];       // 표시할 항목들
  selectedIndex: number;           // 현재 선택된 인덱스
  position: { top: number; left: number };  // 팝업 위치
  onSelect: (item: AutoCompleteItem) => void;  // 항목 선택 시 콜백
  onClose: () => void;             // 팝업 닫기 콜백
}

// ===========================
// 타입별 아이콘/색상 정의
// ===========================
const TYPE_STYLES: Record<AutoCompleteItem["type"], { icon: string; color: string }> = {
  keyword: { icon: "K", color: "#C586C0" },   // 보라색 - 키워드
  class: { icon: "C", color: "#4EC9B0" },     // 청록색 - 클래스
  method: { icon: "M", color: "#DCDCAA" },    // 노란색 - 메서드
  snippet: { icon: "S", color: "#CE9178" },   // 주황색 - 스니펫
};

export default function AutoCompletePopup({
  items,
  selectedIndex,
  position,
  onSelect,
}: AutoCompletePopupProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);

  // ===========================
  // 선택된 항목이 보이도록 스크롤
  // ===========================
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  // 항목이 없으면 렌더링 안함
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
      {/* ===========================
          항목 리스트
          =========================== */}
      <ul
        ref={listRef}
        className="overflow-y-auto max-h-[200px] py-1"
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const style = TYPE_STYLES[item.type];

          return (
            <li
              key={`${item.label}-${index}`}
              ref={isSelected ? selectedRef : null}
              className={`
                flex items-center gap-2 px-2 py-1 cursor-pointer
                ${isSelected ? "bg-[#094771]" : "hover:bg-[#2A2D2E]"}
              `}
              onClick={() => onSelect(item)}
              onMouseDown={(e) => e.preventDefault()} // 포커스 유지
            >
              {/* 타입 아이콘 */}
              <span
                className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded"
                style={{ backgroundColor: style.color + "33", color: style.color }}
              >
                {style.icon}
              </span>

              {/* 레이블 */}
              <span className="flex-1 text-[#D4D4D4] text-sm truncate">
                {item.label}
              </span>

              {/* 설명 (있으면) */}
              {item.detail && (
                <span className="text-xs text-[#808080] truncate max-w-[120px]">
                  {item.detail}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* ===========================
          하단 힌트
          =========================== */}
      <div className="border-t border-[#454545] px-2 py-1 text-xs text-[#808080]">
        ↑↓ 이동 · Enter 선택 · Esc 닫기
      </div>
    </div>
  );
}
