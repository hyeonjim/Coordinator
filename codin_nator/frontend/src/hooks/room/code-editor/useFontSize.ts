/**
 * useFontSize.ts - 코드 에디터 폰트 크기 조절 훅
 *
 * [이 훅의 역할]
 * - 코드 에디터의 폰트 크기를 관리 (증가, 감소, 초기화)
 * - 줄 번호 영역의 너비를 폰트 크기와 줄 수에 따라 동적으로 계산
 * - Ctrl/Cmd + +/-/0 키보드 단축키 처리
 *
 * [useState, useCallback, useMemo 사용]
 * - useState: fontSize 상태 관리 (변경 시 UI 리렌더링)
 * - useCallback: 이벤트 핸들러 함수를 메모이제이션 (불필요한 재생성 방지)
 * - useMemo: lineNumberWidth 계산을 메모이제이션 (코드나 폰트가 바뀔 때만 재계산)
 */
import { useState, useCallback, useMemo } from "react";

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;

export function useFontSize(currentCode: string) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

  // 줄 수에 따라 줄번호 너비 동적 계산
  const lineNumberWidth = useMemo(() => {
    const digits = Math.max(String(currentCode.split("\n").length).length, 2);
    return digits * fontSize * 0.65 + 16;
  }, [currentCode, fontSize]);

  const increaseFontSize = useCallback(() => {
    setFontSize((previous) => Math.min(previous + 2, MAX_FONT_SIZE));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((previous) => Math.max(previous - 2, MIN_FONT_SIZE));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE);
  }, []);

  // Ctrl/Cmd + +/-/0 단축키 처리, 이벤트 처리 시 true 반환
  const handleFontSizeKeyDown = useCallback(
    (event: React.KeyboardEvent): boolean => {
      if (!event.ctrlKey && !event.metaKey) return false;

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        increaseFontSize();
        return true;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        decreaseFontSize();
        return true;
      }
      if (event.key === "0") {
        event.preventDefault();
        resetFontSize();
        return true;
      }
      return false;
    },
    [increaseFontSize, decreaseFontSize, resetFontSize],
  );

  return {
    fontSize,
    lineNumberWidth,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    handleFontSizeKeyDown,
  };
}
